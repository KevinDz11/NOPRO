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

# Importamos los criterios para el Checklist
from backend.services.ia_analisis import CRITERIOS_POR_PRODUCTO

# --- CONFIGURACIÓN DE COLORES (COPIADOS DE TU REACT/TAILWIND) ---
COLOR_TEXT_MAIN = HexColor('#1e293b')   # Slate-800
COLOR_TEXT_SEC  = HexColor('#64748b')   # Slate-500
COLOR_BLUE      = HexColor('#2563eb')   # Blue-600
COLOR_GREEN     = HexColor('#16a34a')   # Green-600
COLOR_RED       = HexColor('#dc2626')   # Red-600
COLOR_PURPLE    = HexColor('#9333ea')   # Purple-600
COLOR_BG_LIGHT  = HexColor('#f8fafc')   # Slate-50
COLOR_BORDER    = HexColor('#e2e8f0')   # Slate-200

# Fondos para contextos
BG_YELLOW_LIGHT = HexColor('#fefce8')
BG_PURPLE_LIGHT = HexColor('#faf5ff')

def generar_pdf_reporte(documento_db, resultados_ia, categoria_producto, tipo_documento, marca_producto, modelo_producto):
    """
    Genera un PDF con diseño visual idéntico al Dashboard de React,
    incluyendo Checklist de cumplimiento y datos de Marca/Modelo.
    """
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

    # --- DEFINICIÓN DE ESTILOS PERSONALIZADOS ---
    style_brand = ParagraphStyle('Brand', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, spaceAfter=2)
    style_title = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=24, textColor=COLOR_TEXT_MAIN, leading=24, spaceAfter=5)
    style_subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=12, textColor=COLOR_BLUE, spaceAfter=20)
    
    style_label = ParagraphStyle('Label', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, alignment=TA_CENTER, textTransform='uppercase')
    style_value = ParagraphStyle('Value', parent=styles['Normal'], fontSize=10, textColor=COLOR_TEXT_MAIN, alignment=TA_CENTER, fontName='Helvetica-Bold')
    style_value_blue = ParagraphStyle('ValueBlue', parent=style_value, textColor=COLOR_BLUE, fontSize=12)
    style_value_green = ParagraphStyle('ValueGreen', parent=style_value, textColor=COLOR_GREEN, fontSize=12)

    # Estilos para Tablas
    style_th = ParagraphStyle('TH', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_SEC, fontName='Helvetica-Bold')
    style_td_norma = ParagraphStyle('TD_Norma', parent=styles['Normal'], fontSize=10, textColor=COLOR_BLUE, fontName='Helvetica-Bold', leading=11)
    style_td_cat = ParagraphStyle('TD_Cat', parent=styles['Normal'], fontSize=8, textColor=COLOR_TEXT_SEC, backColor=COLOR_BG_LIGHT)
    
    style_ctx_text = ParagraphStyle('CtxText', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN, backColor=BG_YELLOW_LIGHT, borderPadding=5)
    style_ctx_visual = ParagraphStyle('CtxVisual', parent=styles['Normal'], fontSize=9, textColor=COLOR_TEXT_MAIN, backColor=BG_PURPLE_LIGHT, borderPadding=5)

    # =========================================================================
    # 1. ENCABEZADO (HEADER) - Dinámico con Marca y Modelo
    # =========================================================================
    
    # Columna Izquierda
    titulo_principal = f"Reporte {tipo_documento}"
    col_izq = [
        Paragraph("REPORTE OFICIAL NOPRO", style_brand),
        Paragraph(titulo_principal, style_title),
        Paragraph("Análisis Automatizado por IA", style_subtitle)
    ]

    # Columna Derecha (Datos del Usuario)
    fecha_texto = datetime.now().strftime('%d/%m/%Y')
    col_der = [
        Paragraph(f"<b>{marca_producto}</b>", ParagraphStyle('Right1', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=14, textColor=COLOR_TEXT_MAIN)),
        Paragraph(f"{modelo_producto}", ParagraphStyle('Right2', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=10, textColor=COLOR_TEXT_SEC)),
        Paragraph(fecha_texto, ParagraphStyle('Right3', parent=styles['Normal'], alignment=TA_RIGHT, fontSize=9, textColor=COLOR_TEXT_SEC, spaceBefore=5))
    ]

    tabla_header = Table([[col_izq, col_der]], colWidths=[110*mm, 70*mm])
    tabla_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEBELOW', (0,0), (-1,-1), 2, COLOR_TEXT_MAIN),
        ('BOTTOMPADDING', (0,0), (-1,-1), 15),
    ]))
    story.append(tabla_header)
    story.append(Spacer(1, 10*mm))

    # =========================================================================
    # 2. CAJA DE RESUMEN
    # =========================================================================
    total_hallazgos = len(resultados_ia) if resultados_ia else 0
    
    c1 = [Paragraph("CATEGORÍA", style_label), Paragraph(categoria_producto, style_value)]
    c2 = [Paragraph("TIPO DOCUMENTO", style_label), Paragraph(tipo_documento, style_value)]
    c3 = [Paragraph("HALLAZGOS", style_label), Paragraph(str(total_hallazgos), style_value_blue)]
    c4 = [Paragraph("ESTADO", style_label), Paragraph("FINALIZADO", style_value_green)]

    tabla_resumen = Table([[c1, c2, c3, c4]], colWidths=[45*mm]*4)
    tabla_resumen.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), COLOR_BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, COLOR_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('INNERGRID', (0,0), (-1,-1), 0.5, COLOR_BORDER),
    ]))
    story.append(tabla_resumen)
    story.append(Spacer(1, 10*mm))

    # =========================================================================
    # 3. CHECKLIST DE CUMPLIMIENTO (NUEVO)
    # =========================================================================
    story.append(Paragraph("1. Checklist de Cumplimiento Normativo", ParagraphStyle('H2', parent=styles['Heading2'], textColor=COLOR_TEXT_MAIN)))
    story.append(Paragraph(f"Evaluación de criterios para: <b>{tipo_documento}</b>", styles['Normal']))
    story.append(Spacer(1, 5*mm))

    # Obtener criterios teóricos
    criterios_teoricos = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {}).get(tipo_documento, {})

    if not criterios_teoricos:
         story.append(Paragraph("No hay criterios normativos definidos para este tipo de documento.", styles['Normal']))
    else:
        data_checklist = [[
            Paragraph("NORMA / ESTÁNDAR", style_th),
            Paragraph("REQUISITO EVALUADO", style_th),
            Paragraph("ESTATUS", ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER))
        ]]

        cumple_global = True

        for norma, requisitos_dict in criterios_teoricos.items():
            for categoria_requisito, _ in requisitos_dict.items():
                # Lógica de Checklist: Buscamos si existe algún hallazgo que coincida con esta Norma y Categoría
                encontrado = False
                if resultados_ia:
                    for item in resultados_ia:
                        # Manejo seguro de diccionarios u objetos
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

                data_checklist.append([
                    Paragraph(norma, styles['Normal']),
                    Paragraph(categoria_requisito, styles['Normal']),
                    status_text
                ])

        t_checklist = Table(data_checklist, colWidths=[50*mm, 100*mm, 30*mm])
        t_checklist.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
            ('LINEBELOW', (0,0), (-1,-1), 0.5, COLOR_BORDER),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(t_checklist)
        
        # Conclusión visual
        story.append(Spacer(1, 5*mm))
        if cumple_global:
             story.append(Paragraph("CONCLUSIÓN: El documento contiene todos los elementos normativos buscados.", ParagraphStyle('ConclOK', parent=styles['Normal'], textColor=COLOR_GREEN)))
        else:
             story.append(Paragraph("CONCLUSIÓN: Faltan elementos obligatorios según la normativa.", ParagraphStyle('ConclFail', parent=styles['Normal'], textColor=COLOR_RED)))

    story.append(Spacer(1, 10*mm))

    # =========================================================================
    # 4. TABLA DE HALLAZGOS (DETALLE DE EVIDENCIAS)
    # =========================================================================
    story.append(Paragraph("2. Detalle de Evidencias Encontradas", ParagraphStyle('H2', parent=styles['Heading2'], textColor=COLOR_TEXT_MAIN)))
    story.append(Spacer(1, 5*mm))

    if not resultados_ia:
        story.append(Paragraph("No se detectaron evidencias específicas.", styles['Normal']))
    else:
        # Encabezados
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
            
            # Columna 1
            color_norma = COLOR_PURPLE if es_visual else COLOR_BLUE
            estilo_norma_dinamico = ParagraphStyle('N_Dyn', parent=style_td_norma, textColor=color_norma)
            celda_izq = [
                Paragraph(norma, estilo_norma_dinamico),
                Spacer(1, 3),
                Paragraph(f" {cat} ", style_td_cat)
            ]

            # Columna 2
            contenido_central = []
            if img_b64:
                try:
                    img_data = base64.b64decode(img_b64)
                    img_stream = io.BytesIO(img_data)
                    im = Image(img_stream, width=90*mm, height=60*mm, kind='proportional')
                    contenido_central.append(Paragraph("📸 EVIDENCIA VISUAL:", style_th))
                    contenido_central.append(Spacer(1, 5))
                    contenido_central.append(im)
                    contenido_central.append(Spacer(1, 5))
                except: pass

            estilo_caja = style_ctx_visual if es_visual else style_ctx_text
            contenido_central.append(Paragraph(f'"{contexto}"', estilo_caja))
            contenido_central.append(Paragraph(f"<b>Patrón:</b> {hallazgo_txt}", ParagraphStyle('Patron', parent=styles['Normal'], fontSize=7, textColor=COLOR_TEXT_SEC)))

            # Columna 3
            celda_der = Paragraph(str(pagina), ParagraphStyle('Pag', parent=styles['Normal'], alignment=TA_CENTER))

            data_tabla.append([celda_izq, contenido_central, celda_der])

        t = Table(data_tabla, colWidths=[55*mm, 105*mm, 20*mm], repeatRows=1)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), COLOR_BG_LIGHT),
            ('LINEBELOW', (0,0), (-1,0), 1, COLOR_BORDER),
            ('LINEBELOW', (0,1), (-1,-1), 0.5, COLOR_BORDER),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(t)

    # Footer
    story.append(Spacer(1, 20*mm))
    texto_legal = "AVISO: Este reporte fue generado automáticamente por NOPRO."
    story.append(Paragraph(texto_legal, ParagraphStyle('Legal', parent=styles['Normal'], fontSize=7, textColor=COLOR_BORDER, alignment=TA_CENTER)))

    doc.build(story)
    buffer.seek(0)
    return buffer