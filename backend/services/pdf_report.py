import io
import base64
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from backend.services.recomendacion_laboratorios import recomendar_laboratorios

# --- 1. CONFIGURACIÓN DE ESTILOS ---
C_SLATE_900 = HexColor('#0f172a')
C_SLATE_800 = HexColor('#1e293b') 
C_SLATE_700 = HexColor('#334155') 
C_SLATE_500 = HexColor('#64748b') 
C_SLATE_200 = HexColor('#e2e8f0') 
C_SLATE_100 = HexColor('#f1f5f9') 
C_SLATE_50  = HexColor('#f8fafc') 

C_BLUE_600  = HexColor('#2563eb')
C_GREEN_600 = HexColor('#16a34a')
C_GREEN_700 = HexColor('#15803d')
C_GREEN_100 = HexColor('#dcfce7')
C_RED_600   = HexColor('#dc2626')
C_RED_700   = HexColor('#b91c1c')
C_RED_100   = HexColor('#fee2e2')

BG_YELLOW_50   = HexColor('#fefce8')
BORDER_YELLOW  = HexColor('#facc15') 
BG_PURPLE_50   = HexColor('#faf5ff')
BORDER_PURPLE  = HexColor('#c084fc') 
TEXT_PURPLE    = HexColor('#9333ea') 

styles = getSampleStyleSheet()

style_brand = ParagraphStyle('Brand', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, spaceAfter=2, fontName='Helvetica-Bold')
style_title = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=18, textColor=C_SLATE_800, leading=22, spaceAfter=2, fontName='Helvetica-Bold')
style_subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=10, textColor=C_BLUE_600, spaceAfter=15, fontName='Helvetica-Bold')
style_h2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=C_SLATE_800, fontSize=12, spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold')
style_h3 = ParagraphStyle('H3', parent=styles['Heading3'], textColor=C_SLATE_700, fontSize=10, spaceBefore=10, spaceAfter=4, fontName='Helvetica-Bold')

style_normal = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_700, leading=12)
style_meta_label = ParagraphStyle('MetaLabel', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, alignment=TA_RIGHT, fontName='Helvetica-Bold')
style_meta_value = ParagraphStyle('MetaValue', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_800, alignment=TA_RIGHT)

style_th = ParagraphStyle('TH', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_500, fontName='Helvetica-Bold')
style_th_center = ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER)
style_cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_800, fontName='Helvetica-Bold')
style_cell_norma_v = ParagraphStyle('CellNormaV', parent=styles['Normal'], fontSize=9, textColor=TEXT_PURPLE, fontName='Helvetica-Bold')
style_cell_norma_t = ParagraphStyle('CellNormaT', parent=styles['Normal'], fontSize=9, textColor=C_BLUE_600, fontName='Helvetica-Bold')
style_tag = ParagraphStyle('Tag', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, backColor=C_SLATE_100, borderPadding=2)

style_legal_title = ParagraphStyle('LegalTitle', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_800, fontName='Helvetica-Bold', spaceBefore=10)
style_legal_text = ParagraphStyle('LegalText', parent=styles['Normal'], fontSize=6, textColor=C_SLATE_500, alignment=TA_JUSTIFY, leading=8)
style_footer = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=HexColor('#94a3b8'), alignment=TA_CENTER)


def _crear_header(titulo_reporte, subtitulo, marca, modelo):
    fecha_texto = datetime.now().strftime('%d/%m/%Y')
    
    col_izq = [
        Paragraph("REPORTE DIGITAL NOPRO", style_brand),
        Paragraph(titulo_reporte, style_title),
        Paragraph(subtitulo, style_subtitle)
    ]
    
    col_der = [
        Paragraph(marca or "Marca Desconocida", style_meta_value),
        Paragraph(modelo or "Modelo no esp.", ParagraphStyle('MetaSmall', parent=style_meta_value, fontSize=8, textColor=C_SLATE_500)),
        Paragraph(f"Fecha: {fecha_texto}", ParagraphStyle('MetaDate', parent=style_meta_value, fontSize=7, textColor=C_SLATE_500, spaceBefore=2))
    ]
    
    t = Table([[col_izq, col_der]], colWidths=[110*mm, 70*mm])
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('LINEBELOW', (0,0), (-1,-1), 1, C_SLATE_800),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def _crear_cards_resumen(categoria, tipo_reporte, total_hallazgos):
    def _card_content(label, value, color_val=C_SLATE_800):
        s_label = ParagraphStyle('CL', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, alignment=TA_CENTER, fontName='Helvetica-Bold')
        s_value = ParagraphStyle('CV', parent=styles['Normal'], fontSize=10, textColor=color_val, alignment=TA_CENTER, fontName='Helvetica-Bold')
        return [Paragraph(label.upper(), s_label), Spacer(1, 2), Paragraph(str(value), s_value)]

    c1 = _card_content("Categoría", categoria or "N/A")
    c2 = _card_content("Tipo Reporte", tipo_reporte)
    c3 = _card_content("Hallazgos", total_hallazgos, C_BLUE_600)
    c4 = _card_content("Estado", "Finalizado", C_GREEN_600)

    t = Table([[c1, c2, c3, c4]], colWidths=[45*mm, 45*mm, 45*mm, 45*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_SLATE_50), 
        ('BOX', (0,0), (0,0), 0.5, C_SLATE_200),    
        ('BOX', (1,0), (1,0), 0.5, C_SLATE_200),    
        ('BOX', (2,0), (2,0), 0.5, C_SLATE_200),    
        ('BOX', (3,0), (3,0), 0.5, C_SLATE_200),    
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return t

def _crear_context_box(texto, hallazgo, es_visual):
    color_bg = BG_PURPLE_50 if es_visual else BG_YELLOW_50
    color_border = BORDER_PURPLE if es_visual else BORDER_YELLOW
    
    s_ctx = ParagraphStyle('Ctx', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_800, fontName='Helvetica-Oblique')
    s_pat = ParagraphStyle('Pat', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500)

    content = [
        Paragraph(f'“{texto}”', s_ctx),
        Spacer(1, 3),
        Paragraph(f"<b>Fuente:</b> {hallazgo}", s_pat)
    ]
    
    t_inner = Table([[ "", content ]], colWidths=[1.5*mm, 88*mm])
    t_inner.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), color_border), 
        ('BACKGROUND', (1,0), (1,0), color_bg),     
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (1,0), (1,0), 6),           
    ]))
    return t_inner

def _crear_badge_estado(cumple):
    text = "✅ Cumple" if cumple else "❌ No detectado"
    color_txt = C_GREEN_700 if cumple else C_RED_700
    color_bg  = C_GREEN_100 if cumple else C_RED_100
    
    p = Paragraph(text, ParagraphStyle('Badge', parent=styles['Normal'], fontSize=7, textColor=color_txt, alignment=TA_CENTER, fontName='Helvetica-Bold'))
    
    t = Table([[p]], colWidths=[25*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color_bg),
        ('ROUNDEDCORNERS', [2, 2, 2, 2]), 
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    return t

def result_has_data(data):
    return data and len(data) > 0

# --- 3. LÓGICA DE SECCIONES ---

def _crear_checklist_unificado(resultado_normativo, analisis_ia=None):
    elementos = []
    
    if not result_has_data(resultado_normativo):
        elementos.append(Paragraph("No hay normas evaluadas para este documento.", style_normal))
        return elementos

    data = [[
        Paragraph("Norma / Estándar", style_th),
        Paragraph("Requisito evaluado", style_th),
        Paragraph("Estado", style_th_center)
    ]]

    # Set de normas con hallazgos reales (IA)
    normas_con_hallazgos = set()
    if analisis_ia:
        for item in analisis_ia:
            n = item.get('Norma')
            if n: normas_con_hallazgos.add(n)

    for norma in resultado_normativo:
        nombre_norma = norma.get('norma', '')
        desc = norma.get('nombre', '') 
        estado_original = norma.get('estado', '')
        
        # Lógica de cumplimiento
        cumple = (estado_original == "CUMPLE")
        
        if not cumple and nombre_norma in normas_con_hallazgos:
            cumple = True

        row = [
            Paragraph(nombre_norma, style_cell_bold),
            Paragraph(desc, style_normal),
            _crear_badge_estado(cumple)
        ]
        data.append(row)

    t = Table(data, colWidths=[50*mm, 100*mm, 30*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_SLATE_50),       
        ('LINEBELOW', (0,0), (-1,0), 1, C_SLATE_200),    
        ('LINEBELOW', (0,1), (-1,-1), 0.5, C_SLATE_200), 
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elementos.append(t)
    return elementos


def _crear_tabla_hallazgos_unificada(analisis_ia, resultado_normativo):
    """
    Combina hallazgos RAW de la IA con evidencias específicas de validación normativa.
    """
    elementos = []
    
    # 1. Combinar listas
    items_a_mostrar = list(analisis_ia) if analisis_ia else []

    # 🔥 NUEVO: Extraer evidencias "visual" de resultado_normativo y agregarlas como hallazgos
    if resultado_normativo:
        for r in resultado_normativo:
            evidencias = r.get("evidencias", [])
            for ev in evidencias:
                if ev.get("tipo") == "visual":
                    # Creamos un objeto similar a analisis_ia para la tabla
                    items_a_mostrar.append({
                        "Norma": r.get("norma"),
                        "Categoria": "Validación Visual",
                        "Contexto": ev.get("descripcion", "Elemento visual detectado"),
                        "Hallazgo": ev.get("fuente", "Regla de Negocio"),
                        "Pagina": "1", # Asumimos página 1 para etiquetas
                        "EsValidacion": True # Flag para identificar
                    })

    if not items_a_mostrar:
        msg = [
            Paragraph("<b>Sin coincidencias normativas</b>", ParagraphStyle('WarnT', parent=styles['Normal'], textColor=HexColor('#9a3412'), fontSize=9)),
            Paragraph("No se detectaron elementos clave en el análisis.", ParagraphStyle('WarnB', parent=styles['Normal'], textColor=HexColor('#9a3412'), fontSize=8))
        ]
        t_warn = Table([[msg]], colWidths=[180*mm])
        t_warn.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HexColor('#fff7ed')),
            ('BOX', (0,0), (-1,-1), 0.5, HexColor('#ffedd5')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        elementos.append(t_warn)
        return elementos

    mapa_desc = {}
    if resultado_normativo:
        for n in resultado_normativo:
            if n.get('norma') and n.get('descripcion'):
                mapa_desc[n['norma']] = n['descripcion']

    data = [[
        Paragraph("Norma y categoría", style_th),
        Paragraph("Descripción norma", style_th),
        Paragraph("Evidencia encontrada", style_th),
        Paragraph("Pág.", style_th_center)
    ]]

    for item in items_a_mostrar:
        def get_attr(obj, key): return obj.get(key) if isinstance(obj, dict) else getattr(obj, key, None)
        
        norma = get_attr(item, 'Norma') or ''
        cat = get_attr(item, 'Categoria') or ''
        contexto = get_attr(item, 'Contexto') or ''
        hallazgo = get_attr(item, 'Hallazgo') or ''
        pagina = get_attr(item, 'Pagina')
        img_b64 = get_attr(item, 'ImagenBase64')
        
        desc_norma = mapa_desc.get(norma, "—")

        # --- CASO 1: EVIDENCIA VISUAL (IMAGEN RAW) ---
        if img_b64:
            try:
                img_bytes = base64.b64decode(img_b64)
                img_stream = io.BytesIO(img_bytes)
                im_flowable = Image(img_stream, width=90*mm, height=75*mm, kind='proportional')
                
                celda_img_content = [
                    Paragraph("📸 EVIDENCIA VISUAL", ParagraphStyle('VisTitle', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                    Spacer(1, 3),
                    im_flowable,
                    Spacer(1, 3),
                    Paragraph(contexto, ParagraphStyle('VisCaption', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, fontName='Helvetica-Oblique', alignment=TA_CENTER))
                ]
                
                c1_img = [
                    Paragraph(norma, style_cell_norma_v),
                    Spacer(1,2),
                    Paragraph(cat, style_tag)
                ]
                
                row_img = [
                    c1_img,                         
                    Paragraph("—", style_normal),   
                    celda_img_content,              
                    Paragraph(str(pagina or "-"), style_normal) 
                ]
                data.append(row_img)
                
            except Exception as e:
                print(f"Error imagen PDF: {e}")
                continue
        
        # --- CASO 2: EVIDENCIA TEXTUAL O VALIDACIÓN VISUAL ---
        else:
            es_visual_norma = any(x in norma for x in ["Visual", "Gráfica"]) or item.get("EsValidacion")
            estilo_norma = style_cell_norma_v if es_visual_norma else style_cell_norma_t
            
            c1 = [
                Paragraph(norma, estilo_norma),
                Spacer(1,2),
                Paragraph(cat, style_tag)
            ]
            c2 = Paragraph(desc_norma, ParagraphStyle('DescSmall', parent=style_normal, fontSize=7))
            c3 = _crear_context_box(contexto, hallazgo, es_visual_norma)
            c4 = Paragraph(str(pagina), ParagraphStyle('PagCenter', parent=style_normal, alignment=TA_CENTER))
            
            data.append([c1, c2, c3, c4])

    t = Table(data, colWidths=[38*mm, 38*mm, 94*mm, 10*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_SLATE_50),
        ('LINEBELOW', (0,0), (-1,0), 1, C_SLATE_200),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, C_SLATE_200),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (2,0), (2,-1), 4),
    ]))
    elementos.append(t)
    return elementos


def _crear_disclaimer_legal():
    elementos = []
    elementos.append(Spacer(1, 15*mm))
    elementos.append(Paragraph("Aviso Legal y Limitación de Responsabilidad", style_legal_title))
    texto = """
    Este reporte ha sido generado automáticamente por un sistema de Inteligencia Artificial (IA) propiedad de NOPRO. 
    El contenido aquí presentado tiene fines exclusivamente informativos y de referencia preliminar. 
    <b>Este documento NO constituye una certificación oficial, dictamen pericial ni validación legal</b> ante organismos de normalización.
    <br/><br/>
    NOPRO no se hace responsable por decisiones tomadas basándose únicamente en la información de este reporte. 
    Se recomienda someter los productos a pruebas de laboratorio certificadas.
    """
    elementos.append(Paragraph(texto, style_legal_text))
    elementos.append(Spacer(1, 10*mm))
    elementos.append(Paragraph("Sistema NOPRO AI Platform v1.0 — Documento confidencial", style_footer))
    return elementos

# --- 4. FUNCIONES EXPORTADAS ---

def generar_pdf_reporte(documento_db, resultados_ia, resultado_normativo, categoria_producto, tipo_documento, marca_producto, modelo_producto):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
        title=f"Reporte {documento_db.nombre}"
    )
    story = []

    # 1. Header
    titulo = f"Reporte {tipo_documento}"
    subtitulo = "Análisis Automatizado por IA"
    story.append(_crear_header(titulo, subtitulo, marca_producto, modelo_producto))
    story.append(Spacer(1, 6*mm))

    # 2. Resumen
    total_hallazgos = len(resultados_ia or [])
    # Sumar evidencias normativas específicas
    if resultado_normativo:
        for r in resultado_normativo:
            total_hallazgos += len([e for e in r.get('evidencias', []) if e.get('tipo') == 'visual'])

    story.append(_crear_cards_resumen(categoria_producto, tipo_documento, total_hallazgos))
    story.append(Spacer(1, 8*mm))

    # 3. Checklist
    story.append(Paragraph("1. Checklist de cumplimiento normativo", style_h2))
    story.extend(_crear_checklist_unificado(resultado_normativo, resultados_ia))
    
    # 4. Hallazgos
    story.append(Paragraph("2. Detalle de evidencias encontradas", style_h2))
    story.extend(_crear_tabla_hallazgos_unificada(resultados_ia, resultado_normativo))

    # 5. Footer
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer

def generar_pdf_reporte_general(lista_docs, categoria_producto, marca_producto, modelo_producto):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=15*mm,
        leftMargin=15*mm,
        topMargin=15*mm,
        bottomMargin=15*mm,
        title="Reporte General NOPRO"
    )

    story = []

    # =====================================================
    # HEADER
    # =====================================================
    story.append(
        _crear_header(
            "Reporte General Unificado",
            "Análisis de Producto Completo",
            marca_producto,
            modelo_producto
        )
    )
    story.append(Spacer(1, 6*mm))

    # =====================================================
    # RESUMEN GLOBAL
    # =====================================================
    total_hallazgos_global = 0

    for item in lista_docs:
        total_hallazgos_global += len(item.get("resultados_ia") or [])

        # Evidencias visuales del checklist normativo
        if item.get("resultado_normativo"):
            for r in item["resultado_normativo"]:
                total_hallazgos_global += len(
                    [e for e in r.get("evidencias", []) if e.get("tipo") == "visual"]
                )

    story.append(
        _crear_cards_resumen(
            categoria_producto,
            "Completo",
            total_hallazgos_global
        )
    )
    story.append(Spacer(1, 10*mm))

    # =====================================================
    # ORDENAR DOCUMENTOS
    # =====================================================
    def get_priority(doc_item):
        n = doc_item["documento"].nombre.lower()
        if "ficha" in n:
            return 1
        if "manual" in n:
            return 2
        if "etiqueta" in n:
            return 3
        return 4

    lista_sorted = sorted(lista_docs, key=get_priority)

    # =====================================================
    # CONTENIDO POR DOCUMENTO
    # =====================================================
    for i, item in enumerate(lista_sorted):
        doc_obj = item["documento"]
        res_ia = item["resultados_ia"]
        res_norm = item["resultado_normativo"]

        if i > 0:
            story.append(Spacer(1, 5*mm))
            story.append(PageBreak())

        story.append(
            Paragraph(
                f"{i+1}. Documento: {doc_obj.nombre}",
                style_h2
            )
        )

        story.append(Paragraph("1. Checklist Normativo", style_h3))
        story.extend(_crear_checklist_unificado(res_norm, res_ia))
        story.append(Spacer(1, 5*mm))

        story.append(Paragraph("2. Evidencias Encontradas", style_h3))
        story.extend(_crear_tabla_hallazgos_unificada(res_ia, res_norm))

    # =====================================================
    # 🔎 OBTENER NORMAS DETECTADAS (GLOBAL)
    # =====================================================
    normas_detectadas = set()

    for item in lista_docs:
        # Desde resultados IA
        for r in item.get("resultados_ia", []):
            norma = r.get("Norma")
            if norma:
                normas_detectadas.add(norma)

        # Desde checklist normativo
        for r in item.get("resultado_normativo", []):
            norma = r.get("norma")
            if norma:
                normas_detectadas.add(norma)

    normas_detectadas = list(normas_detectadas)

    # =====================================================
    # 🧪 RECOMENDACIÓN DE LABORATORIOS
    # =====================================================
    from backend.services.recomendacion_laboratorios import recomendar_laboratorios

    laboratorios_recomendados = recomendar_laboratorios(
        producto=categoria_producto,
        normas_detectadas=normas_detectadas
    )
    # =====================================================
    # SECCIÓN: LABORATORIOS RECOMENDADOS
    # =====================================================
    story.append(PageBreak())
    story.append(Paragraph("Recomendación de Laboratorios Acreditados", style_h2))
    story.append(Spacer(1, 4*mm))

    if not laboratorios_recomendados:
        story.append(
            Paragraph(
                "No se encontraron laboratorios compatibles con las normas detectadas.",
                style_normal
            )
        )
    else:
        for i, lab in enumerate(laboratorios_recomendados[:3]):
            nombre = lab.get("nombre") or "Laboratorio no especificado"
            abrev = lab.get("abreviatura") or ""
            direccion = lab.get("direccion") or "No disponible"
            telefono = lab.get("telefono") or "No disponible"
            servicio = lab.get("tipo_servicio") or "No especificado"
            motivo = lab.get("motivo") or "Laboratorio disponible para pruebas técnicas"

            tipo_ensayo = lab.get("tipo_ensayo")
            if isinstance(tipo_ensayo, list):
                tipo_ensayo_txt = ", ".join(tipo_ensayo)
            else:
                tipo_ensayo_txt = "No especificado"

            story.append(
                Paragraph(
                    f"<b>{i+1}. {nombre} ({abrev})</b>",
                    style_h3
                )
            )
            story.append(Paragraph(f"<b>Dirección:</b> {direccion}", style_normal))
            story.append(Paragraph(f"<b>Teléfono:</b> {telefono}", style_normal))
            story.append(Paragraph(f"<b>Tipo de servicio:</b> {servicio}", style_normal))
            story.append(
                Paragraph(
                    f"<b>Tipo de ensayos:</b> {tipo_ensayo_txt}",
                    style_normal
                )
            )
            story.append(
                Paragraph(
                    f"<b>Motivo de recomendación:</b> {motivo}",
                    style_normal
                )
            )
            story.append(Spacer(1, 4*mm))

    # =====================================================
    # DISCLAIMER + CIERRE DEL PDF
    # =====================================================
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer

