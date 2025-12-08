import io
import base64
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

# Importamos criterios
from backend.services.ia_analisis import CRITERIOS_POR_PRODUCTO

# --- CONFIGURACIÓN DE COLORES ---
COLOR_TEXT_MAIN = HexColor('#1e293b')
COLOR_TEXT_SEC  = HexColor('#64748b')
COLOR_BLUE      = HexColor('#2563eb')
COLOR_GREEN     = HexColor('#16a34a')
COLOR_RED       = HexColor('#dc2626')
COLOR_PURPLE    = HexColor('#9333ea')
COLOR_BG_LIGHT  = HexColor('#f8fafc')
COLOR_BORDER    = HexColor('#e2e8f0')
BG_YELLOW_LIGHT = HexColor('#fefce8')
BG_PURPLE_LIGHT = HexColor('#faf5ff')

# --- ESTILOS GLOBALES ---
styles = getSampleStyleSheet()
style_brand = ParagraphStyle('Brand', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, spaceAfter=2)
style_title = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=24, textColor=COLOR_TEXT_MAIN, leading=24, spaceAfter=5)
style_subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=12, textColor=COLOR_BLUE, spaceAfter=20)
style_h2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=COLOR_TEXT_MAIN, fontSize=16, spaceBefore=10)
style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, alignment=TA_CENTER, textTransform='uppercase')
style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=10, textColor=COLOR_TEXT_MAIN, alignment=TA_CENTER, fontName='Helvetica-Bold')
style_value_blue = ParagraphStyle('ValueBlue', parent=style_value, textColor=COLOR_BLUE, fontSize=12)
style_value_green = ParagraphStyle('ValueGreen', parent=style_value, textColor=COLOR_GREEN, fontSize=12)
style_th = ParagraphStyle('TH', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_SEC, fontName='Helvetica-Bold')
style_td_norma = ParagraphStyle('TD_Norma', parent=styles['Normal'], fontSize=10, textColor=COLOR_BLUE, fontName='Helvetica-Bold', leading=11)
style_td_cat = ParagraphStyle('TD_Cat', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, backColor=COLOR_BG_LIGHT)
style_ctx_text = ParagraphStyle('CtxText', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN, backColor=BG_YELLOW_LIGHT, borderPadding=5)
style_ctx_visual = ParagraphStyle('CtxVisual', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN, backColor=BG_PURPLE_LIGHT, borderPadding=5)

def _crear_header(tipo_documento, marca_producto, modelo_producto):
    """Helper para crear el encabezado de cada sección"""
    fecha_texto = datetime.now().strftime('%d/%m/%Y')
    col_izq = [
        Paragraph("REPORTE OFICIAL NOPRO", style_brand),
        Paragraph(f"Reporte {tipo_documento}", style_title),
        Paragraph("Análisis Automatizado por IA", style_subtitle)
    ]
    col_der = [
        Paragraph(f"<b>{marca_producto}</b>", ParagraphStyle('Right1', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=14, textColor=COLOR_TEXT_MAIN)),
        Paragraph(f"{modelo_producto}", ParagraphStyle('Right2', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=10, textColor=COLOR_TEXT_SEC)),
        Paragraph(fecha_texto, ParagraphStyle('Right3', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=9, textColor=COLOR_TEXT_SEC, spaceBefore=5))
    ]
    t = Table([[col_izq, col_der]], colWidths=[110*mm, 70*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEBELOW', (0,0), (-1,-1), 2, COLOR_TEXT_MAIN),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    return t

def _crear_checklist(resultados_ia, categoria_producto, tipo_documento):
    """Helper para crear la tabla de checklist"""
    elementos = []
    elementos.append(Paragraph("Checklist de Cumplimiento", style_h2))
    
    criterios_teoricos = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {}).get(tipo_documento, {})
    if not criterios_teoricos:
        elementos.append(Paragraph("No hay criterios normativos definidos para este tipo de documento.", styles['Normal']))
        return elementos

    data_checklist = [[
        Paragraph("NORMA / ESTÁNDAR", style_th),
        Paragraph("REQUISITO", style_th),
        Paragraph("ESTATUS", ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER))
    ]]
    
    cumple_global = True
    for norma, requisitos_dict in criterios_teoricos.items():
        for categoria_requisito, _ in requisitos_dict.items():
            encontrado = False
            if resultados_ia:
                for item in resultados_ia:
                    h_norma = item.get('Norma', '') if isinstance(item, dict) else item.Norma
                    h_cat = item.get('Categoria', '') if isinstance(item, dict) else item.Categoria
                    if h_norma == norma and h_cat == categoria_requisito:
                        encontrado = True
                        break
            
            if encontrado:
                status_text = Paragraph("CUMPLE", ParagraphStyle('OK', parent=styles['Normal'], textColor=COLOR_GREEN, fontName='Helvetica-Bold', alignment=TA_CENTER))
            else:
                status_text = Paragraph("NO DETECTADO", ParagraphStyle('Fail', parent=styles['Normal'], textColor=COLOR_RED, fontName='Helvetica-Bold', alignment=TA_CENTER))
                cumple_global = False

            data_checklist.append([Paragraph(norma, styles['Normal']), Paragraph(categoria_requisito, styles['Normal']), status_text])

    t = Table(data_checklist, colWidths=[50*mm, 100*mm, 30*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, COLOR_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elementos.append(t)
    return elementos

def _crear_tabla_hallazgos(resultados_ia):
    """Helper para crear la tabla de evidencias"""
    elementos = []
    elementos.append(Paragraph("Detalle de Evidencias", style_h2))
    
    if not resultados_ia:
        elementos.append(Paragraph("No se detectaron evidencias específicas.", styles['Normal']))
        return elementos

    data_tabla = [[
        Paragraph("NORMA / CATEGORÍA", style_th),
        Paragraph("EVIDENCIA / CONTEXTO", style_th),
        Paragraph("PÁG", ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER))
    ]]
    
    for item in resultados_ia:
        norma = item.get('Norma', '') if isinstance(item, dict) else item.Norma
        cat = item.get('Categoria', '') if isinstance(item, dict) else item.Categoria
        contexto = item.get('Contexto', '') if isinstance(item, dict) else item.Contexto
        hallazgo_txt = item.get('Hallazgo', '') if isinstance(item, dict) else item.Hallazgo
        pagina = item.get('Pagina', 0) if isinstance(item, dict) else item.Pagina
        img_b64 = item.get('ImagenBase64') if isinstance(item, dict) else item.ImagenBase64

        es_visual = any(x in norma for x in ["Visual", "Gráfica", "Imagen"])
        color_norma = COLOR_PURPLE if es_visual else COLOR_BLUE
        estilo_norma = ParagraphStyle('N_Dyn', parent=style_td_norma, textColor=color_norma)
        
        celda_izq = [Paragraph(norma, estilo_norma), Spacer(1, 3), Paragraph(f" {cat} ", style_td_cat)]
        
        contenido_central = []
        if img_b64:
            try:
                img_data = base64.b64decode(img_b64)
                img_stream = io.BytesIO(img_data)
                im = Image(img_stream, width=90*mm, height=60*mm, kind='proportional')
                contenido_central.append(im)
            except: pass
        
        estilo_caja = style_ctx_visual if es_visual else style_ctx_text
        contenido_central.append(Paragraph(f'"{contexto}"', estilo_caja))
        contenido_central.append(Paragraph(f"<b>Patrón:</b> {hallazgo_txt}", ParagraphStyle('Patron', parent=styles['Normal'], fontSize=7, textColor=COLOR_TEXT_SEC)))
        
        data_tabla.append([celda_izq, contenido_central, Paragraph(str(pagina), ParagraphStyle('Pag', parent=styles['Normal'], alignment=TA_CENTER))])

    t = Table(data_tabla, colWidths=[55*mm, 105*mm, 20*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('LINEBELOW', (0,0), (-1,0), 1, COLOR_BORDER),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, COLOR_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
    ]))
    elementos.append(t)
    return elementos

# --- FUNCIÓN PRINCIPAL INDIVIDUAL ---
def generar_pdf_reporte(documento_db, resultados_ia, categoria_producto, tipo_documento, marca_producto, modelo_producto):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    story = []
    
    story.append(_crear_header(tipo_documento, marca_producto, modelo_producto))
    story.append(Spacer(1, 10*mm))
    story.extend(_crear_checklist(resultados_ia, categoria_producto, tipo_documento))
    story.append(Spacer(1, 10*mm))
    story.extend(_crear_tabla_hallazgos(resultados_ia))
    
    doc.build(story)
    buffer.seek(0)
    return buffer

# --- FUNCIÓN NUEVA: REPORTE GENERAL UNIFICADO ---
def generar_pdf_reporte_general(lista_docs, categoria_producto, marca_producto, modelo_producto):
    """Genera un PDF multipágina con todos los documentos"""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    story = []

    # PORTADA DEL REPORTE GENERAL
    story.append(Paragraph("REPORTE GENERAL UNIFICADO", style_title))
    story.append(Paragraph(f"Producto: {marca_producto} - {modelo_producto}", style_subtitle))
    story.append(Paragraph(f"Fecha: {datetime.now().strftime('%d/%m/%Y')}", styles['Normal']))
    story.append(Spacer(1, 10*mm))
    
    # Resumen Ejecutivo
    story.append(Paragraph("Resumen de Documentos Analizados", style_h2))
    data_resumen = [['Documento', 'Tipo Detectado', 'Hallazgos']]
    total_hallazgos = 0
    
    for item in lista_docs:
        doc_obj = item['doc']
        resultados = item['resultados']
        
        tipo_clean = "Ficha"
        if "manual" in doc_obj.nombre.lower(): tipo_clean = "Manual"
        elif "etiqueta" in doc_obj.nombre.lower(): tipo_clean = "Etiqueta"
        
        cant = len(resultados) if resultados else 0
        total_hallazgos += cant
        data_resumen.append([doc_obj.nombre, tipo_clean, str(cant)])

    t_res = Table(data_resumen, colWidths=[100*mm, 40*mm, 30*mm])
    t_res.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
    ]))
    story.append(t_res)
    story.append(PageBreak())

    # SECCIONES POR DOCUMENTO
    for item in lista_docs:
        doc_obj = item['doc']
        resultados = item['resultados']
        
        tipo_clean = "Ficha"
        if "manual" in doc_obj.nombre.lower(): tipo_clean = "Manual"
        elif "etiqueta" in doc_obj.nombre.lower(): tipo_clean = "Etiqueta"

        # Encabezado individual
        story.append(_crear_header(f"{tipo_clean} - {doc_obj.nombre}", marca_producto, modelo_producto))
        story.append(Spacer(1, 5*mm))
        
        # Checklist individual
        story.extend(_crear_checklist(resultados, categoria_producto, tipo_clean))
        story.append(Spacer(1, 5*mm))
        
        # Evidencias individuales
        story.extend(_crear_tabla_hallazgos(resultados))
        
        story.append(PageBreak())

    doc.build(story)
    buffer.seek(0)
    return buffer