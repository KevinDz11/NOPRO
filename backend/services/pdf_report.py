import io
import base64
from datetime import datetime
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor

# Importamos criterios
from reportlab.platypus import Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

styles = getSampleStyleSheet()

# --- CONFIGURACIÓN DE COLORES (Igual a React) ---
COLOR_TEXT_MAIN = HexColor('#1e293b')  # Slate-800
COLOR_TEXT_SEC  = HexColor('#64748b')  # Slate-500
COLOR_BLUE      = HexColor('#2563eb')  # Blue-600
COLOR_GREEN     = HexColor('#16a34a')  # Green-600
COLOR_RED       = HexColor('#dc2626')  # Red-600
COLOR_BG_LIGHT  = HexColor('#f8fafc')  # Slate-50
COLOR_BORDER    = HexColor('#e2e8f0')  # Slate-200
BG_YELLOW_LIGHT = HexColor('#fefce8')
BG_PURPLE_LIGHT = HexColor('#faf5ff')

# --- ESTILOS GLOBALES ---
styles = getSampleStyleSheet()

style_brand = ParagraphStyle('Brand', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, spaceAfter=2)
style_title = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=22, textColor=COLOR_TEXT_MAIN, leading=26, spaceAfter=5, fontName='Helvetica-Bold')
style_subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=12, textColor=COLOR_BLUE, spaceAfter=20)
style_h2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=COLOR_TEXT_MAIN, fontSize=14, spaceBefore=15, spaceAfter=8, fontName='Helvetica-Bold')

# Estilos de Tablas
style_th = ParagraphStyle('TH', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_SEC, fontName='Helvetica-Bold')
style_th_center = ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER)
style_cell_norma = ParagraphStyle('CellNorma', parent=styles['Normal'], fontSize=9, textColor=COLOR_BLUE, fontName='Helvetica-Bold', leading=10)
style_cell_cat = ParagraphStyle('CellCat', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC)
style_cell_text = ParagraphStyle('CellText', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN)

# Contextos
style_ctx_text = ParagraphStyle('CtxText', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_MAIN, backColor=BG_YELLOW_LIGHT, borderPadding=4)
style_ctx_visual = ParagraphStyle('CtxVisual', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_MAIN, backColor=BG_PURPLE_LIGHT, borderPadding=4)
style_patron = ParagraphStyle('Patron', parent=styles['Normal'], fontSize=7, textColor=COLOR_TEXT_SEC, spaceBefore=2)

# Disclaimer Legal
style_legal_title = ParagraphStyle('LegalTitle', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN, fontName='Helvetica-Bold', spaceBefore=10)
style_legal_text = ParagraphStyle('LegalText', parent=styles['Normal'], fontSize=7, textColor=COLOR_TEXT_SEC, alignment=TA_JUSTIFY, leading=9)

def _crear_header(tipo_documento, marca_producto, modelo_producto):
    """Encabezado limpio y profesional"""
    fecha_texto = datetime.now().strftime('%d/%m/%Y')
    
    col_izq = [
        Paragraph("REPORTE DIGITAL NOPRO", style_brand),
        Paragraph(f"{tipo_documento}", style_title),
        Paragraph("Análisis automatizado por IA", style_subtitle)
    ]
    
    col_der = [
        Paragraph(f"<b>{marca_producto}</b>", ParagraphStyle('Right1', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=12, textColor=COLOR_TEXT_MAIN)),
        Paragraph(f"{modelo_producto}", ParagraphStyle('Right2', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=9, textColor=COLOR_TEXT_SEC)),
        Paragraph(f"Fecha: {fecha_texto}", ParagraphStyle('Right3', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=8, textColor=COLOR_TEXT_SEC, spaceBefore=4))
    ]
    
    t = Table([[col_izq, col_der]], colWidths=[110*mm, 70*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEBELOW', (0,0), (-1,-1), 1.5, COLOR_TEXT_MAIN),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    return t

def _crear_checklist(resultados_ia, categoria_producto, tipo_key):
    """Tabla de checklist con ortografía cuidada"""
    elementos = []
    elementos.append(Paragraph("1. Checklist de cumplimiento normativo", style_h2))
    
    # Buscamos usando la llave correcta (Ficha, Manual, Etiqueta)
    criterios_teoricos = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {}).get(tipo_key, {})
    
    if not criterios_teoricos:
        elementos.append(Paragraph(f"No hay criterios normativos definidos para: {tipo_key}.", styles['Normal']))
        return elementos

    data_checklist = [[
        Paragraph("Norma / Estándar", style_th),
        Paragraph("Requisito evaluado", style_th),
        Paragraph("Estatus", style_th_center)
    ]]
    
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
                status_text = Paragraph("✅ Cumple", ParagraphStyle('OK', parent=styles['Normal'], textColor=COLOR_GREEN, fontSize=8, alignment=TA_CENTER))
            else:
                status_text = Paragraph("❌ No detectado", ParagraphStyle('Fail', parent=styles['Normal'], textColor=COLOR_RED, fontSize=8, alignment=TA_CENTER))

            data_checklist.append([
                Paragraph(norma, style_cell_text), 
                Paragraph(categoria_requisito, style_cell_text), 
                status_text
            ])

    t = Table(data_checklist, colWidths=[50*mm, 100*mm, 30*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('LINEBELOW', (0,0), (-1,0), 1, COLOR_BORDER),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, COLOR_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elementos.append(t)
    return elementos

def _crear_tabla_hallazgos(resultados_ia):
    """Tabla de evidencias detallada"""
    elementos = []
    elementos.append(Paragraph("2. Detalle de evidencias encontradas", style_h2))
    
    if not resultados_ia:
        elementos.append(Paragraph("No se detectaron evidencias específicas en el análisis.", styles['Normal']))
        return elementos

    data_tabla = [[
        Paragraph("Norma y categoría", style_th),
        Paragraph("Evidencia y contexto", style_th),
        Paragraph("Pág.", style_th_center)
    ]]
    
    for item in resultados_ia:
        norma = item.get('Norma', '') if isinstance(item, dict) else item.Norma
        cat = item.get('Categoria', '') if isinstance(item, dict) else item.Categoria
        contexto = item.get('Contexto', '') if isinstance(item, dict) else item.Contexto
        hallazgo_txt = item.get('Hallazgo', '') if isinstance(item, dict) else item.Hallazgo
        pagina = item.get('Pagina', 0) if isinstance(item, dict) else item.Pagina
        img_b64 = item.get('ImagenBase64') if isinstance(item, dict) else item.ImagenBase64

        es_visual = any(x in norma for x in ["Visual", "Gráfica", "Imagen"])
        
        celda_izq = [
            Paragraph(norma, style_cell_norma),
            Spacer(1, 2),
            Paragraph(cat, style_cell_cat)
        ]
        
        contenido_central = []
        if img_b64:
            try:
                img_data = base64.b64decode(img_b64)
                img_stream = io.BytesIO(img_data)
                im = Image(img_stream, width=80*mm, height=50*mm, kind='proportional')
                contenido_central.append(im)
                contenido_central.append(Spacer(1, 4))
            except: pass
        
        estilo_caja = style_ctx_visual if es_visual else style_ctx_text
        contenido_central.append(Paragraph(f'"{contexto}"', estilo_caja))
        contenido_central.append(Paragraph(f"<b>Patrón detectado:</b> {hallazgo_txt}", style_patron))
        
        celda_pag = Paragraph(str(pagina), ParagraphStyle('Pag', parent=styles['Normal'], alignment=TA_CENTER, fontSize=8))

        data_tabla.append([celda_izq, contenido_central, celda_pag])

    t = Table(data_tabla, colWidths=[50*mm, 110*mm, 20*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
        ('LINEBELOW', (0,0), (-1,0), 1, COLOR_BORDER),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, COLOR_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elementos.append(t)
    return elementos

def _crear_disclaimer_legal():
    """Genera el bloque de texto legal"""
    elementos = []
    elementos.append(Spacer(1, 15*mm))
    elementos.append(Paragraph("Aviso Legal y Limitación de Responsabilidad", style_legal_title))
    texto_legal = """
    Este reporte ha sido generado automáticamente por un sistema de Inteligencia Artificial (IA) propiedad de NOPRO. 
    El contenido aquí presentado tiene fines exclusivamente informativos y de referencia preliminar. 
    <b>Este documento NO constituye una certificación oficial, dictamen pericial ni validación legal</b> ante organismos de normalización o autoridades competentes (como PROFECO, NYCE, ANCE, IFT, etc.).
    <br/><br/>
    NOPRO no se hace responsable por decisiones tomadas basándose únicamente en la información de este reporte. 
    Se recomienda encarecidamente someter los productos a pruebas de laboratorio certificadas y revisión por expertos humanos cualificados para garantizar el cumplimiento normativo estricto.
    """
    elementos.append(Paragraph(texto_legal, style_legal_text))
    return elementos

def _render_valores_tecnicos(valores: dict):
    elementos = []

    if not valores:
        elementos.append(
            Paragraph("No se detectaron valores técnicos explícitos.", styles["Italic"])
        )
        return elementos

    for k, v in valores.items():
        elementos.append(
            Paragraph(f"• <b>{k.capitalize()}</b>: {v}", styles["Normal"])
        )

    return elementos
# --- FUNCIÓN REPORTE INDIVIDUAL (Sin cambios mayores, solo estilos) ---
def generar_pdf_reporte(
    documento_db,
    resultados_ia,
    resultado_normativo,   # 🆕
    categoria_producto,
    tipo_documento,
    marca_producto,
    modelo_producto
):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm
    )

    story = []
    styles = getSampleStyleSheet()

    # --------------------------------------------------
    # Encabezado
    # --------------------------------------------------
    tipo_display = tipo_documento
    if tipo_documento == "Manual":
        tipo_display = "Manual de Usuario"
    elif tipo_documento == "Etiqueta":
        tipo_display = "Etiquetado"
    elif tipo_documento == "Ficha":
        tipo_display = "Ficha Técnica"

    story.append(_crear_header(
        f"Reporte {tipo_display}",
        marca_producto,
        modelo_producto
    ))
    story.append(Spacer(1, 8*mm))

    # --------------------------------------------------
    # Checklist (SE QUEDA IGUAL)
    # --------------------------------------------------
    story.extend(_crear_checklist(resultados_ia, categoria_producto, tipo_documento))
    story.append(Spacer(1, 8*mm))

    # --------------------------------------------------
    # 🆕 RESULTADO NORMATIVO (PASO 4)
    # --------------------------------------------------
    story.append(Paragraph("<b>Resultado del Análisis Normativo</b>", styles["Heading2"]))
    story.append(Spacer(1, 6*mm))

    for norma in resultado_normativo:

        titulo = f"{norma['norma']} — {norma['nombre']}"
        story.append(Paragraph(f"<b>{titulo}</b>", styles["Heading3"]))

        story.append(Paragraph(
            f"<b>¿Qué evalúa?</b> {norma['descripcion']}",
            styles["Normal"]
        ))

        estado = norma["estado"]
        estado_txt = "✅ CUMPLE" if estado == "CUMPLE" else "❌ NO DETECTADO"

        story.append(Paragraph(
            f"<b>Estado:</b> {estado_txt}",
            styles["Normal"]
        ))

        story.append(Spacer(1, 4*mm))

        if norma["evidencias"]:
            story.append(Paragraph("<b>Evidencia encontrada:</b>", styles["Normal"]))
            for ev in norma["evidencias"]:
                texto_ev = f"• Página {ev['pagina']} — “{ev['contexto']}”"
                story.append(Paragraph(texto_ev, styles["Normal"]))
        else:
            story.append(Paragraph(
                "No se encontró evidencia en el documento analizado.",
                styles["Italic"]
            ))

        story.append(Spacer(1, 8*mm))

    # --------------------------------------------------
    # Tabla de hallazgos IA (SE QUEDA IGUAL)
    # --------------------------------------------------
    story.extend(_crear_tabla_hallazgos(resultados_ia))

    # --------------------------------------------------
    # Disclaimer legal (SE QUEDA IGUAL)
    # --------------------------------------------------
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer


# --- FUNCIÓN REPORTE GENERAL (Modificada: Sin portada, con orden específico) ---
def generar_pdf_reporte_general(lista_docs, categoria_producto, marca_producto, modelo_producto):
    """Genera un PDF con todos los documentos, ordenado y sin portada resumen."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm)
    story = []

    # 1. FUNCIÓN DE ORDENAMIENTO PERSONALIZADO
    # Prioridad: Ficha (1) -> Manual (2) -> Etiqueta (3) -> Otros (4)
    def get_priority(doc_item):
        nombre = doc_item['doc'].nombre.lower()
        if "ficha" in nombre: return 1
        if "manual" in nombre: return 2
        if "etiqueta" in nombre: return 3
        return 4
    
    # Ordenamos la lista antes de procesar
    lista_docs_sorted = sorted(lista_docs, key=get_priority)

    # 2. GENERACIÓN DE SECCIONES DIRECTAS (Sin portada)
    for i, item in enumerate(lista_docs_sorted):
        doc_obj = item['doc']
        resultados = item['resultados']
        nombre_lower = doc_obj.nombre.lower()

        # Determinar Tipo para Lógica (Keys exactas del diccionario de criterios)
        tipo_key = "Ficha"
        if "manual" in nombre_lower: tipo_key = "Manual"
        elif "etiqueta" in nombre_lower: tipo_key = "Etiqueta"

        # Determinar Tipo para Display (Títulos estéticos)
        tipo_display = "Ficha Técnica"
        if tipo_key == "Manual": tipo_display = "Manual de Usuario"
        elif tipo_key == "Etiqueta": tipo_display = "Etiquetado"

        # Encabezado individual
        story.append(_crear_header(f"{i+1}. {tipo_display}: {doc_obj.nombre}", marca_producto, modelo_producto))
        story.append(Spacer(1, 5*mm))
        
        # Checklist
        story.extend(_crear_checklist(resultados, categoria_producto, tipo_key))
        story.append(Spacer(1, 8*mm))
        
        # Evidencias
        story.extend(_crear_tabla_hallazgos(resultados))
        
        # Salto de página entre documentos (excepto después del último)
        if i < len(lista_docs_sorted) - 1:
            story.append(PageBreak())

    # 3. LEGAL (Al final del reporte completo)
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer