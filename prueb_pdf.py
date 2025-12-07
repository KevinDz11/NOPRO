import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import LETTER
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from datetime import datetime

# Importamos los criterios
from backend.services.ia_analisis import CRITERIOS_POR_PRODUCTO

# --- BASE DE DATOS DE INFORMACIÓN ADICIONAL ---
INFO_ADICIONAL = {
    "Laptop": {
        "laboratorios": [
            {"nombre": "NYCE (Normalización y Certificación)", "contacto": "contacto@nyce.org.mx", "servicio": "Seguridad y Eficiencia"},
            {"nombre": "ANCE", "contacto": "servicios@ance.org.mx", "servicio": "Pruebas de Seguridad Eléctrica"}
        ],
        "pruebas_recomendadas": [
            "Pruebas de seguridad mecánica y eléctrica (NOM-019-SE-2021)",
            "Medición de consumo de energía en espera (NOM-029-ENER-2017)",
            "Pruebas de etiquetado de información comercial (NOM-024-SCFI-2013)"
        ]
    },
    "SmartTV": {
        "laboratorios": [
            {"nombre": "NYCE", "contacto": "contacto@nyce.org.mx", "servicio": "Certificación Electrónica"},
            {"nombre": "Logis", "contacto": "info@logis.com.mx", "servicio": "Pruebas de Conectividad (IFT)"}
        ],
        "pruebas_recomendadas": [
            "Seguridad en aparatos electrónicos (NOM-001-SCFI-2018)",
            "Límites de consumo de energía (NOM-032-ENER-2013)",
            "Especificaciones de interfaces (IFT-008-2015)"
        ]
    },
    "Luminaria": {
        "laboratorios": [
            {"nombre": "ANCE", "contacto": "servicios@ance.org.mx", "servicio": "Seguridad Productos Eléctricos"},
            {"nombre": "UL de México", "contacto": "sales.mx@ul.com", "servicio": "Certificación de Seguridad"}
        ],
        "pruebas_recomendadas": [
            "Eficacia luminosa para LED (NOM-030-ENER-2016)",
            "Seguridad general de luminarios (NOM-003-SCFI-2014)",
            "Resistencia a la humedad y polvo (IP Rating)"
        ]
    }
}

NOTAS_LEGALES = (
    "AVISO LEGAL: Este reporte ha sido generado automáticamente por un sistema de Inteligencia Artificial "
    "denominado 'NOPRO'. Los resultados presentados son una estimación basada en el análisis de documentos "
    "digitales y NO constituyen un dictamen oficial ni una certificación legal válida ante autoridades. "
    "Para obtener una certificación oficial, debe acudir a un Organismo de Certificación Acreditado."
)

def generar_pdf_reporte(documento_db, resultados_ia, categoria_producto, tipo_documento):
    """
    Genera un PDF en memoria (BytesIO) con el reporte completo.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=LETTER, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    
    styles = getSampleStyleSheet()
    
    # --- ESTILOS ---
    estilo_titulo = ParagraphStyle(name='Titulo', parent=styles['Heading1'], alignment=TA_CENTER, textColor=colors.darkblue)
    estilo_subtitulo = ParagraphStyle(name='Subtitulo', parent=styles['Heading2'], textColor=colors.black, spaceBefore=15)
    estilo_normal = styles['Normal']
    estilo_legal = ParagraphStyle(name='Legal', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_JUSTIFY)
    
    # CORRECCIÓN: Creamos un estilo específico para centrar texto normal
    estilo_centro = ParagraphStyle(name='Centro', parent=styles['Normal'], alignment=TA_CENTER)

    # 1. ENCABEZADO
    story.append(Paragraph(f"Reporte de Análisis Normativo: {categoria_producto}", estilo_titulo))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"<b>Archivo:</b> {documento_db.nombre}", estilo_normal))
    story.append(Paragraph(f"<b>Fecha de Análisis:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}", estilo_normal))
    story.append(Spacer(1, 20))

    # 2. CHECKLIST DE CUMPLIMIENTO (NOMS)
    story.append(Paragraph("1. Checklist de Cumplimiento Normativo", estilo_subtitulo))
    story.append(Paragraph("Evaluación basada en los criterios detectados en el documento.", estilo_normal))
    story.append(Spacer(1, 10))

    # Obtenemos los criterios teóricos que DEBERÍA cumplir
    criterios_teoricos = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {}).get(tipo_documento, {})
    
    if not criterios_teoricos:
        story.append(Paragraph("No se encontraron criterios de referencia para este tipo de documento.", estilo_normal))
    else:
        # Preparamos datos tabla
        data_tabla = [['Norma / Estándar', 'Requisito', 'Estatus']]
        
        cumple_todo = True
        
        # Iteramos sobre lo que se espera (La teoría)
        for norma, requisitos_dict in criterios_teoricos.items():
            for categoria_requisito, _ in requisitos_dict.items():
                # Verificar si este par Norma-Categoria existe en los resultados encontrados (La práctica)
                encontrado = False
                for hallazgo in resultados_ia:
                    # Ajuste: A veces hallazgo es dict, a veces objeto Pydantic
                    h_norma = hallazgo.get('Norma', '') if isinstance(hallazgo, dict) else hallazgo.Norma
                    h_cat = hallazgo.get('Categoria', '') if isinstance(hallazgo, dict) else hallazgo.Categoria
                    
                    if h_norma == norma and h_cat == categoria_requisito:
                        encontrado = True
                        break
                
                estado_simbolo = "✅ CUMPLE" if encontrado else "❌ NO DETECTADO"
                if not encontrado: cumple_todo = False
                
                data_tabla.append([norma, categoria_requisito, estado_simbolo])

        # Estilo de la tabla
        tabla = Table(data_tabla, colWidths=[150, 250, 100])
        tabla.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.navy),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(tabla)
        
        if cumple_todo:
            story.append(Paragraph("Resultado Global: EL DOCUMENTO PARECE CUMPLIR CON LOS REQUISITOS ANALIZADOS.", ParagraphStyle('ok', parent=styles['Normal'], textColor=colors.green, spaceBefore=10)))
        else:
            story.append(Paragraph("Resultado Global: FALTAN ELEMENTOS OBLIGATORIOS EN EL DOCUMENTO.", ParagraphStyle('fail', parent=styles['Normal'], textColor=colors.red, spaceBefore=10)))

    story.append(Spacer(1, 20))

    # 3. PRUEBAS RECOMENDADAS
    info_prod = INFO_ADICIONAL.get(categoria_producto, {})
    pruebas = info_prod.get("pruebas_recomendadas", [])
    
    story.append(Paragraph("2. Recomendación de Pruebas para Certificación", estilo_subtitulo))
    if pruebas:
        for p in pruebas:
            story.append(Paragraph(f"• {p}", estilo_normal))
    else:
        story.append(Paragraph("No hay pruebas específicas registradas para esta categoría.", estilo_normal))

    story.append(Spacer(1, 20))

    # 4. LISTADO DE LABORATORIOS
    laboratorios = info_prod.get("laboratorios", [])
    story.append(Paragraph("3. Laboratorios Acreditados Sugeridos", estilo_subtitulo))
    
    if laboratorios:
        data_labs = [['Laboratorio', 'Servicio', 'Contacto']]
        for lab in laboratorios:
            data_labs.append([lab['nombre'], lab['servicio'], lab['contacto']])
        
        t_labs = Table(data_labs, colWidths=[150, 180, 170])
        t_labs.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        story.append(t_labs)
    else:
        story.append(Paragraph("Consulte el catálogo de la entidad mexicana de acreditación (ema).", estilo_normal))

    story.append(Spacer(1, 30))

    # 5. NOTAS LEGALES (Footer)
    # CORRECCIÓN: Usamos 'estilo_centro' en lugar de TA_CENTER crudo
    story.append(Paragraph("---", estilo_centro))
    story.append(Paragraph(NOTAS_LEGALES, estilo_legal))

    # Construir PDF
    doc.build(story)
    buffer.seek(0)
    return buffer