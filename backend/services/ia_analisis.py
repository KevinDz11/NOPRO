import pdfplumber
import re
import spacy
from unidecode import unidecode
from backend.services import ia_vision
from backend.services.criterios import CRITERIOS_POR_PRODUCTO

#  CONFIGURACIÓN SPACY (LAZY LOADING)
_nlp_instance = None
 #Carga el modelo spaCy solo cuando se necesita.
def get_nlp():
    global _nlp_instance
    if _nlp_instance is None:
        try:
            print("⏳ Cargando modelo spaCy (Lazy Load)...")
            _nlp_instance = spacy.load("es_core_news_md", disable=["ner", "tagger"])
            _nlp_instance.add_pipe("sentencizer")
            print("✅ Modelo spaCy cargado correctamente.")
        except OSError:
            print("⚠️ Modelo Spacy no encontrado. Descargando...")
            from spacy.cli import download
            download("es_core_news_md")
            _nlp_instance = spacy.load("es_core_news_md", disable=["ner", "tagger"])
            _nlp_instance.add_pipe("sentencizer")
    return _nlp_instance

PATRONES_TECNICOS = {
    "voltaje": re.compile(r'(\d{2,3}\s*[-–]\s*\d{2,3}\s*v)', re.IGNORECASE),
    "frecuencia": re.compile(r'(\d{2,3}\s*/\s*\d{2,3}\s*hz|\d{2,3}\s*hz)', re.IGNORECASE),
    "potencia": re.compile(r'(\d+(\.\d+)?\s*w)', re.IGNORECASE),
    "corriente": re.compile(r'(\d+(\.\d+)?\s*a)', re.IGNORECASE),
    "ip": re.compile(r'(ip\s?\d{2})', re.IGNORECASE)
}

YOLO_A_NORMA = {
    "nom": "NOM-024-SCFI-2013",
    "nyce": "NMX-I-60950-1-NYCE-2015",
    "energia": "NOM-031-ENER-2019",
    "hecho en mexico": "NOM-024-SCFI-2013",
    "warning": "NOM-001-SCFI-2018",
    "riesgo": "NOM-001-SCFI-2018",
    "marca": "NOM-024-SCFI-2013"
}

#DETECCIÓN DE ÍNDICE / TABLA DE CONTENIDO

PATRONES_INDICE = [
    r"\bindice\b",
    r"\btabla de contenido\b",
    r"\bcontenido\b",
    r"\bcap[ií]tulo\b\s+\d+",
    r"\bsecci[oó]n\b\s+\d+",
    r"\.{3,}\s*\d+$",
    r"\bpag\.\s*\d+",
]


#FUNCIONES DE EXTRACCIÓN Y ANÁLISIS
#Extrae texto y genera un objeto DOC de spaCy por página.
def extraer_documento_spacy(ruta_pdf):
    docs_paginas = []
    nlp = get_nlp() #LAZY LOADING: Aquí se carga Spacy
    
    try:
        with pdfplumber.open(ruta_pdf) as pdf:
            for i, pagina in enumerate(pdf.pages):
                txt = pagina.extract_text()
                if txt:
                    # 1. Limpieza básica
                    clean_text = unidecode(txt.lower()) 
                    clean_text = re.sub(r'\s+', ' ', clean_text).strip()
                    
                    # 2. PROCESAMIENTO CON SPACY
                    doc = nlp(clean_text)
                    
                    es_indice = es_pagina_indice(txt)
                    docs_paginas.append({
                        "pagina": i + 1,
                        "doc_spacy": doc,
                        "original": txt,
                        "es_indice": es_indice
})

    except Exception as e:
        print(f"Error leyendo PDF: {e}")
    return docs_paginas

#Determina si una página corresponde a un índice o tabla de contenido.
def es_pagina_indice(texto: str) -> bool:
    if not texto:
        return False

    texto_limpio = unidecode(texto.lower())

    coincidencias = 0
    for patron in PATRONES_INDICE:
        if re.search(patron, texto_limpio):
            coincidencias += 1

    # Si cumple varios criterios, se considera índice
    return coincidencias >= 2

#ANÁLISIS PRINCIPAL CON SPACY Y REGEX
def analizar_documento(ruta_pdf, tipo_doc, categoria_producto, marca_esperada=None):
    resultados = []

    #ANÁLISIS DE TEXTO (Ficha Técnica / Manual)
    if tipo_doc != "Etiqueta":
        print(f"Analizando TEXTO (Motor spaCy) para {tipo_doc} de {categoria_producto}...")

        prod_criterios = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {})
        normas_a_buscar = prod_criterios.get(tipo_doc, {})

        if normas_a_buscar:
            docs_paginas = extraer_documento_spacy(ruta_pdf)

            for norma, categorias in normas_a_buscar.items():
                for categoria, lista_patrones in categorias.items():
                    for patron_str in lista_patrones:

                        try:
                            regex = re.compile(patron_str, re.IGNORECASE)
                        except re.error:
                            continue

                        for pag_data in docs_paginas:

                            #DESCARTAR ÍNDICE
                            if pag_data.get("es_indice"):
                                continue

                            doc = pag_data["doc_spacy"]

                            for sent in doc.sents:

                                match = regex.search(sent.text)
                                if not match:
                                    continue

                                texto_lower = sent.text.lower()

                                #Detección simple de sección
                                seccion = "General"
                                if any(w in texto_lower for w in ["advertencia", "precaucion", "riesgo"]):
                                    seccion = "Advertencias"
                                elif any(w in texto_lower for w in ["instalacion", "conectar", "montaje"]):
                                    seccion = "Instalación"
                                elif any(w in texto_lower for w in ["voltaje", "corriente", "potencia", "frecuencia"]):
                                    seccion = "Especificaciones eléctricas"
                                elif any(w in texto_lower for w in ["mantenimiento", "limpieza"]):
                                    seccion = "Mantenimiento"

                                #Extracción de valores técnicos
                                valores = extraer_valores_tecnicos(sent.text)

                                hallazgo = f"Declaración explícita de {categoria.lower()}"
                                if valores:
                                    detalles = ", ".join(f"{k}: {v}" for k, v in valores.items())
                                    hallazgo += f" ({detalles})"

                                resultados.append({
                                    "Norma": norma,
                                    "Categoria": categoria,
                                    "Seccion": seccion,
                                    "Hallazgo": hallazgo,
                                    "ValoresTecnicos": valores,
                                    "Pagina": pag_data["pagina"],
                                    "Contexto": sent.text.strip()
                                })

    else:
        print(f"OMITIENDO análisis de texto para {tipo_doc} (Se requiere solo Visual).")


    #ANÁLISIS VISUAL (ETIQUETA)
    if ruta_pdf.lower().endswith(".pdf") and tipo_doc == "Etiqueta":
        print(f"\n--- DEBUG VISUAL (Solo Etiqueta) ---")
        try:
            hallazgos = ia_vision.analizar_imagen_pdf(ruta_pdf)

            yolo_list = hallazgos.get("yolo_detections", [])
            google_list = hallazgos.get("google_detections", [])
            img_base64 = hallazgos.get("image_base64")

            hallazgos_totales = []
            if google_list:
                hallazgos_totales.extend(google_list)
            if yolo_list:
                hallazgos_totales.extend(yolo_list)

            #YOLO → NORMAS
            normas_detectadas = set()
            for h in hallazgos_totales:
                h_lower = h.lower()
                for clave, norma in YOLO_A_NORMA.items():
                    if clave in h_lower:
                        normas_detectadas.add(norma)

            if hallazgos_totales:
                hallazgos_str = ", ".join(hallazgos_totales)
                resultados.append({
                    "Norma": "Inspección Visual IA",
                    "Categoria": "Elementos Identificados",
                    "Hallazgo": hallazgos_str,
                    "NormasDetectadas": list(normas_detectadas),
                    "tipo": "visual",
                    "Pagina": 1,
                    "Contexto": f"Elementos visuales detectados: {hallazgos_str}"
                })
            else:
                resultados.append({
                    "Norma": "Inspección Visual IA",
                    "Categoria": "Sin Hallazgos Textuales",
                    "Hallazgo": "N/A",
                    "NormasDetectadas": [],
                    "tipo": "visual",
                    "Pagina": 1,
                    "Contexto": "No se detectaron textos legibles o logos conocidos."
                })

            if img_base64:
                resultados.append({
                    "Norma": "Evidencia Gráfica",
                    "Categoria": "Análisis de Imagen",
                    "Hallazgo": "Detección de Objetos",
                    "Pagina": 1,
                    "Contexto": "Visualización de zonas detectadas por la IA.",
                    "ImagenBase64": img_base64
                })

        except Exception as e:
            print(f"ERROR CRÍTICO EN ANALISIS.PY (Visual): {e}")
            resultados.append({
                "Norma": "Error Sistema",
                "Categoria": "Fallo en Visión",
                "Hallazgo": str(e),
                "Pagina": 0,
                "Contexto": "Ocurrió un error al procesar la imagen."
            })

    return resultados



def extraer_valores_tecnicos(texto: str) -> dict:
    #Extrae valores técnicos estructurados desde un texto.
    valores = {}

    for nombre, patron in PATRONES_TECNICOS.items():
        match = patron.search(texto)
        if match:
            valores[nombre] = match.group(1)

    return valores
