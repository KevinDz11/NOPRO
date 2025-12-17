import re
from backend.services.catalogo_normas import CATALOGO_NORMAS
from backend.services.criterios import CRITERIOS_POR_PRODUCTO

#LISTA AMPLIADA DE MARCAS (Smart TV + Laptops)
MARCAS_COMUNES = [
    #Principales Globales
    "SAMSUNG", "SAMSUNG ELECTRONICS",
    "LG", "LG ELECTRONICS", "LUCKY GOLDSTAR", "LUCKY-GOLDSTAR",
    "SONY",
    "PANASONIC",
    "HP", "HEWLETT-PACKARD", "HEWLETT PACKARD",
    "DELL",
    "LENOVO",
    "ASUS",
    "ACER",
    "APPLE",
    "MACBOOK",
    
    # TV y Monitores
    "HISENSE",
    "TCL",
    "PHILIPS",
    "VIZIO",
    "SHARP",
    "JVC",
    "TOSHIBA",
    "RCA",
    "SANYO",
    "DAEWOO",
    "HITACHI",
    "HAIER",
    "PIONEER",
    "SANSUI",
    "POLAROID",
    "KODAK",
    "INSIGNIA",
    "ELEMENT",
    "WESTINGHOUSE",
    "ATVIO",
    "ONN",
    
    # Computo y Móviles
    "XIAOMI", "MI",
    "HUAWEI",
    "HONOR",
    "MOTOROLA", "MOTO",
    "NOKIA",
    "ZTE",
    "ALCATEL",
    "MSI",
    "RAZER",
    "ALIENWARE",
    "GIGABYTE",
    "MICROSOFT", "SURFACE",
    "GATEWAY",
    "COMPAQ",
    "FUJITSU",
    
    # Marcas Nacionales / Regionales (México/Latam)
    "LANIX",
    "GHIA",
    "VORAGO",
    "STF", "STF MOBILE",
    "SENWA"
]

#UTILIDAD: EXTRAER NOMs DESDE TEXTO / CONTEXTO
def extraer_noms_de_texto(texto: str):
    """
    Extrae NOMs tipo:
    - NOM-019-SE-2021
    - NOM-024-SCFI-2013
    - NOM-106-SCFI-2000
    """
    if not texto:
        return []
    patron = r"NOM-\d{3}-[A-Z]+-\d{4}"
    return re.findall(patron, texto.upper())


def normalizar_logo_visual(valor: str):
    """
    Normaliza etiquetas que pueden venir de YOLO/OCR:
    - "NOM-CE" -> "NOM-CE"
    - "nyce"   -> "NYCE"
    """
    if not valor:
        return ""
    v = str(valor).upper().strip()
    v = v.replace("_", "-").replace(" ", "-")

    if v.startswith("NOM-"):
        return v 

    if v == "NOM":
        return "NOM"

    if "NYCE" in v and not v.startswith("NOM-"):
        return "NYCE"

    return v


def es_evidencia_visual(r: dict):
    """
    Considera visual:
    - Norma == "Inspección Visual IA"
    - Norma contiene "Visual" o "Gráfica"
    - Trae ImagenBase64 (evidencia de imagen)
    """
    norma = (r.get("Norma") or "").lower()
    if r.get("ImagenBase64"):
        return True
    if norma == "inspección visual ia":
        return True
    if "visual" in norma or "grafica" in norma or "gráfica" in norma:
        return True
    return False

#SCORE DE CONFIANZA
def calcular_score_norma(
    categoria_producto: str,
    tipo_documento: str,
    norma: str,
    evidencias: list
):
    if any(ev.get("tipo") == "visual" for ev in evidencias):
        return 100

    prod_criterios = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {})
    normas_doc = prod_criterios.get(tipo_documento, {})
    categorias_esperadas = normas_doc.get(norma, {})

    if not categorias_esperadas:
        return 0

    categorias_detectadas = {
        ev.get("categoria") for ev in evidencias if ev.get("categoria")
    }

    total = len(categorias_esperadas)
    detectadas = len(categorias_detectadas)

    return round((detectadas / total) * 100, 2) if total > 0 else 0


#CONSTRUCTOR PRINCIPAL DEL CHECKLIST
def construir_resultado_normativo(
    categoria_producto: str,
    tipo_documento: str,
    resultados_ia: list
):

    #Normalización del tipo de documento
    td = (tipo_documento or "").lower().strip()
    if "ficha" in td:
        tipo_documento = "Ficha"
    elif "manual" in td:
        tipo_documento = "Manual"
    elif "etiqueta" in td:
        tipo_documento = "Etiqueta"
    else:
        print(f"⚠️ Tipo de documento no reconocido: {tipo_documento}")

    resultado = []
    normas_catalogo = CATALOGO_NORMAS.get(categoria_producto, {})

    #Agrupar evidencias IA
    evidencias_por_norma = {}
    normas_detectadas_visual = set()
    texto_visual_completo = ""

    for r in resultados_ia or []:
        norma_r = r.get("Norma", "")
        contexto = r.get("Contexto", "") or ""

        #VISUAL (cualquier evidencia visual)
        if es_evidencia_visual(r):
            # Acumular texto visual para reglas por norma
            texto_visual_completo += " " + contexto

            #NOMs completas en el contexto
            for nom in extraer_noms_de_texto(contexto):
                normas_detectadas_visual.add(nom)

            #NOM genérico (palabra sola)
            if re.search(r"(?<![A-Z0-9-])NOM(?![A-Z0-9-])", contexto.upper()):
                normas_detectadas_visual.add("NOM")

            #Logos detectados
            for n in r.get("NormasDetectadas", []) or []:
                normas_detectadas_visual.add(normalizar_logo_visual(n))
                texto_visual_completo += " " + str(n)

            continue

        # TEXTUAL (spaCy/regex)
        if norma_r:
            evidencias_por_norma.setdefault(norma_r, []).append(r)

    texto_visual_completo = (texto_visual_completo or "").lower()

    #REGLAS DE VALIDACIÓN VISUAL (DINÁMICAS)
    def val_nom_106():
        if "NOM" in normas_detectadas_visual:
            return True
        return bool(re.search(r"(?<![a-z0-9-])nom(?![a-z0-9-])", texto_visual_completo))

    def val_nmx_60950():
        claves = ["doble aislamiento", "choque electr", "nom-ce", "nom-ul", "nom-nyce"]
        if any(x in normas_detectadas_visual for x in ["NOM-CE", "NOM-UL", "NOM-NYCE"]):
            return True
        return any(k in texto_visual_completo for k in claves)

    def val_nom_024():
        claves = ["contenido", "cont.", "incluye", "contenido especial", "raee", "reciclado"]
        return any(k in texto_visual_completo for k in claves)

    def val_nmx_640():
        #Palabra clave explícita
        if "marca" in texto_visual_completo:
            return True
            
        #Búsqueda de marcas conocidas (dinámico)
        for marca in MARCAS_COMUNES:
            #Buscamos la marca como palabra completa para evitar falsos positivos cortos (ej: "MI")
            if re.search(rf"\b{re.escape(marca)}\b", texto_visual_completo.upper()):
                return True
                
        return False

    #Construir checklist final
    for clave_norma, info in normas_catalogo.items():
        normas_forzadas_etiqueta = [
            "NOM-106-SCFI-2000",
            "NMX-I-60950-1-NYCE-2015", 
            "NOM-024-SCFI-2013",
            "NMX-J-640-ANCE-2010"
        ]

        aplica_por_catalogo = tipo_documento in info.get("documentos_aplicables", [])
        aplica_forzoso = (tipo_documento == "Etiqueta" and clave_norma in normas_forzadas_etiqueta)

        if not aplica_por_catalogo and not aplica_forzoso:
            continue

        evidencias = []

        #Texto
        if clave_norma in evidencias_por_norma:
            evidencias.extend(evidencias_por_norma[clave_norma])

        #Visual (Reglas específicas)
        cumple_visual = False

        if tipo_documento == "Etiqueta":
            
            #LAPTOP
            if categoria_producto == "Laptop":
                if clave_norma == "NMX-I-60950-1-NYCE-2015":
                    cumple_visual = val_nmx_60950()
                elif clave_norma == "NMX-J-640-ANCE-2010":
                    cumple_visual = val_nmx_640()
                elif clave_norma == "NOM-106-SCFI-2000":
                    cumple_visual = val_nom_106()
                elif clave_norma == "NOM-024-SCFI-2013":
                    cumple_visual = val_nom_024()
                else:
                    cumple_visual = (clave_norma in normas_detectadas_visual)

            #SMART TV
            elif categoria_producto == "SmartTV":
                if clave_norma == "NOM-106-SCFI-2000":
                    cumple_visual = val_nom_106()
                elif clave_norma == "NMX-I-60950-1-NYCE-2015":
                    cumple_visual = val_nmx_60950()
                elif clave_norma == "NOM-024-SCFI-2013":
                    cumple_visual = val_nom_024()
                elif clave_norma == "NMX-J-640-ANCE-2010":
                    cumple_visual = val_nmx_640()
                else:
                    cumple_visual = (clave_norma in normas_detectadas_visual)

            #LUMINARIA Y OTROS
            else:
                if clave_norma == "NOM-106-SCFI-2000":
                    cumple_visual = val_nom_106()
                else:
                    cumple_visual = (clave_norma in normas_detectadas_visual)

            if cumple_visual:
                evidencias.append({
                    "tipo": "visual",
                    "descripcion": f"Elemento visual válido para {clave_norma}",
                    "fuente": "YOLO / OCR"
                })

        #Estado Final
        if tipo_documento == "Etiqueta":
            estado = "CUMPLE" if cumple_visual else "NO DETECTADO"
        else:
            estado = "CUMPLE" if evidencias else "NO DETECTADO"

        resultado.append({
            "norma": clave_norma,
            "nombre": info["nombre"],
            "descripcion": info["descripcion"],
            "documentos_aplicables": info["documentos_aplicables"],
            "evidencia_esperada": info["evidencia_esperada"],
            "estado": estado,
            "score_confianza": calcular_score_norma(
                categoria_producto,
                tipo_documento,
                clave_norma,
                evidencias
            ),
            "evidencias": evidencias
        })

    return resultado