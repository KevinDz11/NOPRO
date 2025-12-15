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

# Importamos criterios (Mantenemos tu lógica original)
from backend.services.criterios import CRITERIOS_POR_PRODUCTO

# --- 1. CONFIGURACIÓN DE ESTILOS (IDÉNTICO A REACT/TAILWIND) ---
# Colores extraídos de ResultadosAnalisis.jsx
C_SLATE_900 = HexColor('#0f172a')
C_SLATE_800 = HexColor('#1e293b') # Títulos principales
C_SLATE_700 = HexColor('#334155') # Texto cuerpo
C_SLATE_500 = HexColor('#64748b') # Subtítulos / Metadata
C_SLATE_200 = HexColor('#e2e8f0') # Bordes
C_SLATE_100 = HexColor('#f1f5f9') # Backgrounds tags
C_SLATE_50  = HexColor('#f8fafc') # Background headers/cards

C_BLUE_600  = HexColor('#2563eb')
C_GREEN_600 = HexColor('#16a34a')
C_GREEN_700 = HexColor('#15803d')
C_GREEN_100 = HexColor('#dcfce7')
C_RED_600   = HexColor('#dc2626')
C_RED_700   = HexColor('#b91c1c')
C_RED_100   = HexColor('#fee2e2')

# Contextos (Textual vs Visual)
BG_YELLOW_50   = HexColor('#fefce8')
BORDER_YELLOW  = HexColor('#facc15') # Yellow-400
BG_PURPLE_50   = HexColor('#faf5ff')
BORDER_PURPLE  = HexColor('#c084fc') # Purple-400
TEXT_PURPLE    = HexColor('#9333ea') # Purple-600

# Estilos de Párrafo
styles = getSampleStyleSheet()

# Títulos
style_brand = ParagraphStyle('Brand', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, spaceAfter=2, fontName='Helvetica-Bold')
style_title = ParagraphStyle('MainTitle', parent=styles['Heading1'], fontSize=18, textColor=C_SLATE_800, leading=22, spaceAfter=2, fontName='Helvetica-Bold')
style_subtitle = ParagraphStyle('SubTitle', parent=styles['Normal'], fontSize=10, textColor=C_BLUE_600, spaceAfter=15, fontName='Helvetica-Bold')
style_h2 = ParagraphStyle('H2', parent=styles['Heading2'], textColor=C_SLATE_800, fontSize=12, spaceBefore=20, spaceAfter=10, fontName='Helvetica-Bold')
style_h3 = ParagraphStyle('H3', parent=styles['Heading3'], textColor=C_SLATE_700, fontSize=10, spaceBefore=10, spaceAfter=4, fontName='Helvetica-Bold')

# Textos Generales
style_normal = ParagraphStyle('NormalText', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_700, leading=12)
style_meta_label = ParagraphStyle('MetaLabel', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, alignment=TA_RIGHT, fontName='Helvetica-Bold')
style_meta_value = ParagraphStyle('MetaValue', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_800, alignment=TA_RIGHT)

# Estilos de Tablas (Headers y Celdas)
style_th = ParagraphStyle('TH', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_500, fontName='Helvetica-Bold')
style_th_center = ParagraphStyle('TH_Center', parent=style_th, alignment=TA_CENTER)
style_cell_bold = ParagraphStyle('CellBold', parent=styles['Normal'], fontSize=9, textColor=C_SLATE_800, fontName='Helvetica-Bold')
style_cell_norma_v = ParagraphStyle('CellNormaV', parent=styles['Normal'], fontSize=9, textColor=TEXT_PURPLE, fontName='Helvetica-Bold')
style_cell_norma_t = ParagraphStyle('CellNormaT', parent=styles['Normal'], fontSize=9, textColor=C_BLUE_600, fontName='Helvetica-Bold')
style_tag = ParagraphStyle('Tag', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, backColor=C_SLATE_100, borderPadding=2)

# Estilos Legales
style_legal_title = ParagraphStyle('LegalTitle', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_800, fontName='Helvetica-Bold', spaceBefore=10)
style_legal_text = ParagraphStyle('LegalText', parent=styles['Normal'], fontSize=6, textColor=C_SLATE_500, alignment=TA_JUSTIFY, leading=8)
style_footer = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=7, textColor=HexColor('#94a3b8'), alignment=TA_CENTER)

# --- 2. COMPONENTES VISUALES ---

def _crear_header(titulo_reporte, subtitulo, marca, modelo):
    """Header estilo Flex: Izquierda (Logo/Títulos) - Derecha (Metadata)"""
    fecha_texto = datetime.now().strftime('%d/%m/%Y')
    
    # Columna Izquierda
    col_izq = [
        Paragraph("REPORTE DIGITAL NOPRO", style_brand),
        Paragraph(titulo_reporte, style_title),
        Paragraph(subtitulo, style_subtitle)
    ]
    
    # Columna Derecha
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
    """
    Simula la sección 'summaryBox' de React: 4 tarjetas alineadas.
    Como ReportLab no tiene 'flex', usamos una tabla con celdas coloreadas.
    """
    
    def _card_content(label, value, color_val=C_SLATE_800):
        s_label = ParagraphStyle('CL', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, alignment=TA_CENTER, fontName='Helvetica-Bold')
        s_value = ParagraphStyle('CV', parent=styles['Normal'], fontSize=10, textColor=color_val, alignment=TA_CENTER, fontName='Helvetica-Bold')
        return [Paragraph(label.upper(), s_label), Spacer(1, 2), Paragraph(str(value), s_value)]

    # Datos de las 4 tarjetas
    c1 = _card_content("Categoría", categoria or "N/A")
    c2 = _card_content("Tipo Reporte", tipo_reporte)
    c3 = _card_content("Hallazgos", total_hallazgos, C_BLUE_600)
    c4 = _card_content("Estado", "Finalizado", C_GREEN_600)

    # Tabla contenedora (simulando el gap con celdas vacías si fuera necesario, o padding)
    # Estructura: | Card 1 | Card 2 | Card 3 | Card 4 |
    data = [[c1, c2, c3, c4]]
    
    t = Table(data, colWidths=[45*mm, 45*mm, 45*mm, 45*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), C_SLATE_50), # Fondo gris claro general
        ('BOX', (0,0), (0,0), 0.5, C_SLATE_200),     # Border card 1
        ('BOX', (1,0), (1,0), 0.5, C_SLATE_200),     # Border card 2
        ('BOX', (2,0), (2,0), 0.5, C_SLATE_200),     # Border card 3
        ('BOX', (3,0), (3,0), 0.5, C_SLATE_200),     # Border card 4
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 2),
        ('RIGHTPADDING', (0,0), (-1,-1), 2),
    ]))
    return t

def _crear_context_box(texto, hallazgo, es_visual):
    """
    Crea la caja de texto con borde de color a la izquierda.
    AJUSTE: El ancho debe ser menor al ancho de la columna padre (aprox 90mm).
    """
    color_bg = BG_PURPLE_50 if es_visual else BG_YELLOW_50
    color_border = BORDER_PURPLE if es_visual else BORDER_YELLOW
    
    # Estilos internos
    s_ctx = ParagraphStyle('Ctx', parent=styles['Normal'], fontSize=8, textColor=C_SLATE_800, fontName='Helvetica-Oblique')
    s_pat = ParagraphStyle('Pat', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500)

    # Contenido de la derecha
    content = [
        Paragraph(f'“{texto}”', s_ctx),
        Spacer(1, 3),
        Paragraph(f"<b>Patrón:</b> {hallazgo}", s_pat)
    ]
    
    # AJUSTE AQUÍ: Reducimos 105mm a 88mm para que quepa en la columna padre con holgura
    # 1.5mm (barra) + 88mm (texto) = 89.5mm Total
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
    """Crea una pequeña tabla que parece un 'Badge' o Píldora"""
    text = "✅ Cumple" if cumple else "❌ No detectado"
    color_txt = C_GREEN_700 if cumple else C_RED_700
    color_bg  = C_GREEN_100 if cumple else C_RED_100
    
    p = Paragraph(text, ParagraphStyle('Badge', parent=styles['Normal'], fontSize=7, textColor=color_txt, alignment=TA_CENTER, fontName='Helvetica-Bold'))
    
    t = Table([[p]], colWidths=[25*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), color_bg),
        ('ROUNDEDCORNERS', [2, 2, 2, 2]), # Intento de redondeo (no siempre funciona perfecto en versiones viejas de reportlab, pero da fondo)
        ('TOPPADDING', (0,0), (-1,-1), 1),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
    ]))
    return t

# --- 3. LOGICA DE SECCIONES ---

def _crear_checklist_unificado(resultado_normativo):
    elementos = []
    
    if not result_has_data(resultado_normativo):
        elementos.append(Paragraph("No hay normas evaluadas para este documento.", style_normal))
        return elementos

    # Headers de tabla
    data = [[
        Paragraph("Norma / Estándar", style_th),
        Paragraph("Requisito evaluado", style_th),
        Paragraph("Estado", style_th_center)
    ]]

    for norma in resultado_normativo:
        nombre_norma = norma.get('norma', '')
        desc = norma.get('nombre', '') # En el JSON a veces es 'nombre' o 'descripcion' corta
        estado = norma.get('estado', '')
        cumple = (estado == "CUMPLE")
        
        row = [
            Paragraph(nombre_norma, style_cell_bold),
            Paragraph(desc, style_normal),
            _crear_badge_estado(cumple)
        ]
        data.append(row)

    t = Table(data, colWidths=[50*mm, 100*mm, 30*mm], repeatRows=1)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_SLATE_50),       # Header BG
        ('LINEBELOW', (0,0), (-1,0), 1, C_SLATE_200),    # Header Border
        ('LINEBELOW', (0,1), (-1,-1), 0.5, C_SLATE_200), # Rows Border
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elementos.append(t)
    return elementos

def _crear_tabla_hallazgos_unificada(analisis_ia, resultado_normativo):
    """
    Combina lógica de visualización:
    1. Mapa de descripciones de norma.
    2. Renderizado de evidencias (Visual vs Texto).
    """
    elementos = []
    
    if not result_has_data(analisis_ia):
        # Caja de "Sin coincidencias" estilo React (Naranja claro)
        msg = [
            Paragraph("<b>Sin coincidencias normativas</b>", ParagraphStyle('WarnT', parent=styles['Normal'], textColor=HexColor('#9a3412'), fontSize=9)),
            Paragraph("No se detectaron elementos clave en el análisis de texto.", ParagraphStyle('WarnB', parent=styles['Normal'], textColor=HexColor('#9a3412'), fontSize=8))
        ]
        t_warn = Table([[msg]], colWidths=[180*mm])
        t_warn.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), HexColor('#fff7ed')),
            ('BOX', (0,0), (-1,-1), 0.5, HexColor('#ffedd5')),
            ('PADDING', (0,0), (-1,-1), 10),
        ]))
        elementos.append(t_warn)
        return elementos

    # Crear mapa de descripciones para mostrar en tabla
    mapa_desc = {}
    if resultado_normativo:
        for n in resultado_normativo:
            if n.get('norma') and n.get('descripcion'):
                mapa_desc[n['norma']] = n['descripcion']

    # Headers
    data = [[
        Paragraph("Norma y categoría", style_th),
        Paragraph("Descripción norma", style_th),
        Paragraph("Evidencia encontrada", style_th),
        Paragraph("Pág.", style_th_center)
    ]]

    for item in analisis_ia:
        # Normalizar objeto (puede ser dict o objeto pydantic)
        def get_attr(obj, key): return obj.get(key) if isinstance(obj, dict) else getattr(obj, key, None)
        
        norma = get_attr(item, 'Norma') or ''
        cat = get_attr(item, 'Categoria') or ''
        contexto = get_attr(item, 'Contexto') or ''
        hallazgo = get_attr(item, 'Hallazgo') or ''
        pagina = get_attr(item, 'Pagina')
        img_b64 = get_attr(item, 'ImagenBase64')
        
        desc_norma = mapa_desc.get(norma, "—")

        # --- CASO 1: EVIDENCIA VISUAL (Imagen) ---
        if img_b64:
            try:
                img_bytes = base64.b64decode(img_b64)
                img_stream = io.BytesIO(img_bytes)
                # Max width 80mm, height proporcional
                im_flowable = Image(img_stream, width=80*mm, height=50*mm, kind='proportional')
                
                # Layout interno de la celda de imagen (Título + Imagen + Pie)
                celda_img_content = [
                    Paragraph("📸 EVIDENCIA VISUAL", ParagraphStyle('VisTitle', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, fontName='Helvetica-Bold', alignment=TA_CENTER)),
                    Spacer(1, 3),
                    im_flowable,
                    Spacer(1, 3),
                    Paragraph(contexto, ParagraphStyle('VisCaption', parent=styles['Normal'], fontSize=7, textColor=C_SLATE_500, fontName='Helvetica-Oblique', alignment=TA_CENTER))
                ]
                
                # Fila especial que ocupa todo el ancho o columnas combinadas
                # Para simplificar en esta tabla de 4 columnas, haremos un "Span" manual si fuera complejo,
                # pero aquí lo meteremos en una fila donde la evidencia ocupa más espacio visual.
                # React lo hace en una fila completa. Aquí haremos una fila donde las celdas laterales estan vacias o fusionadas.
                # ReportLab Span: ('SPAN', (col1, row), (col2, row))
                
                row_img = [
                    Paragraph("Visual", style_tag), # Col 1 dummy
                    Paragraph("—", style_normal),   # Col 2 dummy
                    celda_img_content,              # Col 3 (Evidencia)
                    Paragraph(str(pagina or "-"), style_normal) # Col 4
                ]
                
                # Truco: Añadimos la fila y luego aplicamos estilo al índice actual
                data.append(row_img)
                idx = len(data) - 1
                # En React ocupa todo el ancho. Aquí simplificaremos poniendo la imagen en la columna de evidencia (que haremos ancha)
                # O podríamos hacer un SPAN (0,idx) a (3,idx) pero rompería la estructura de columnas.
                # Mantendremos columnas fijas para consistencia.
                
            except Exception as e:
                print(f"Error imagen PDF: {e}")
                continue
        
        # --- CASO 2: EVIDENCIA TEXTUAL ---
        else:
            es_visual_norma = any(x in norma for x in ["Visual", "Gráfica"])
            
            # Celda 1: Norma y Tag Categoria
            estilo_norma = style_cell_norma_v if es_visual_norma else style_cell_norma_t
            c1 = [
                Paragraph(norma, estilo_norma),
                Spacer(1,2),
                Paragraph(cat, style_tag) # Pill gris
            ]
            
            # Celda 2: Descripción
            c2 = Paragraph(desc_norma, ParagraphStyle('DescSmall', parent=style_normal, fontSize=7))
            
            # Celda 3: Caja de Contexto (Yellow/Purple)
            c3 = _crear_context_box(contexto, hallazgo, es_visual_norma)
            
            # Celda 4: Pagina
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
    """Footer Legal idéntico"""
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

def result_has_data(data):
    return data and len(data) > 0

# --- 4. FUNCIONES EXPORTADAS (GENERADORES) ---

def generar_pdf_reporte(documento_db, resultados_ia, resultado_normativo, categoria_producto, tipo_documento, marca_producto, modelo_producto):
    """
    Genera el PDF Individual recreando la vista React.
    """
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

    # 2. Cards Resumen (Estilo React)
    total_hallazgos = len(resultados_ia) if resultados_ia else 0
    story.append(_crear_cards_resumen(categoria_producto, tipo_documento, total_hallazgos))
    story.append(Spacer(1, 8*mm))

    # 3. Sección Checklist
    story.append(Paragraph("1. Checklist de cumplimiento normativo", style_h2))
    story.extend(_crear_checklist_unificado(resultado_normativo))
    
    # 4. Sección Hallazgos Detallados
    story.append(Paragraph("2. Detalle de evidencias encontradas", style_h2))
    story.extend(_crear_tabla_hallazgos_unificada(resultados_ia, resultado_normativo))

    # 5. Footer
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer


def generar_pdf_reporte_general(lista_docs, categoria_producto, marca_producto, modelo_producto):
    """
    Genera el PDF General (Unificado) con el mismo estilo visual.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=15*mm, leftMargin=15*mm, topMargin=15*mm, bottomMargin=15*mm, title="Reporte General NOPRO")
    story = []

    # --- PORTADA / HEADER GENERAL ---
    story.append(_crear_header("Reporte General Unificado", "Análisis de Producto Completo", marca_producto, modelo_producto))
    story.append(Spacer(1, 6*mm))

    # Cards Resumen Totales
    total_hallazgos_global = sum([len(item['resultados_ia'] or []) for item in lista_docs])
    story.append(_crear_cards_resumen(categoria_producto, "Completo", total_hallazgos_global))
    story.append(Spacer(1, 10*mm))

    # --- ITERACIÓN DE DOCUMENTOS ---
    # Ordenar: Ficha -> Manual -> Etiqueta -> Otros
    def get_priority(doc_item):
        n = doc_item['documento'].nombre.lower()
        if "ficha" in n: return 1
        if "manual" in n: return 2
        if "etiqueta" in n: return 3
        return 4
    
    lista_sorted = sorted(lista_docs, key=get_priority)

    for i, item in enumerate(lista_sorted):
        doc_obj = item['documento']
        res_ia = item['resultados_ia']
        res_norm = item['resultado_normativo']
        
        # Título de Sección del Documento (con línea punteada arriba si no es el primero)
        if i > 0:
            story.append(Spacer(1, 5*mm))
            # Línea separadora
            story.append(Paragraph("", ParagraphStyle('Sep', parent=styles['Normal'], borderPadding=0, borderWidth=0, spaceAfter=10)))
            story.append(PageBreak())

        story.append(Paragraph(f"{i+1}. Documento: {doc_obj.nombre}", style_h2))
        
        # Subtítulo pequeño
        story.append(Paragraph("1. Checklist Normativo", style_h3))
        story.extend(_crear_checklist_unificado(res_norm))
        story.append(Spacer(1, 5*mm))

        story.append(Paragraph("2. Evidencias Encontradas", style_h3))
        story.extend(_crear_tabla_hallazgos_unificada(res_ia, res_norm))
        
    # Footer al final de todo
    story.extend(_crear_disclaimer_legal())

    doc.build(story)
    buffer.seek(0)
    return buffer