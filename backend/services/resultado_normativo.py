from backend.services.catalogo_normas import CATALOGO_NORMAS
from backend.services.criterios import CRITERIOS_POR_PRODUCTO


def calcular_score_norma(
    categoria_producto: str,
    tipo_documento: str,
    norma: str,
    evidencias: list
):
    # 🔥 REGLA CLAVE: evidencia visual = cumplimiento total
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


def construir_resultado_normativo(
    categoria_producto: str,
    tipo_documento: str,
    resultados_ia: list
):
    """
    Construye el checklist normativo final combinando:
    - Evidencia textual (spaCy + regex)
    - Evidencia visual (YOLO)
    """

    # =====================================================
    # 🧠 NORMALIZACIÓN DEL TIPO DE DOCUMENTO
    # =====================================================
    td = tipo_documento.lower().strip()

    if "ficha" in td:
        tipo_documento = "Ficha"
    elif "manual" in td:
        tipo_documento = "Manual"
    elif "etiqueta" in td:
        tipo_documento = "Etiqueta"
    else:
        print(f"⚠️ Tipo de documento no reconocido: {tipo_documento}")

    resultado = []

    # -------------------------------
    # 1. Catálogo de normas
    # -------------------------------
    normas_catalogo = CATALOGO_NORMAS.get(categoria_producto, {})

    # -------------------------------
    # 2. Agrupar evidencias IA
    # -------------------------------
    evidencias_por_norma = {}
    normas_detectadas_visual = set()
    # =====================================================
    # 🔥 NORMALIZAR LOGOS YOLO → NORMAS OFICIALES
    # =====================================================
    MAPEO_VISUAL_A_NORMA = {
    "NOM": "NOM-106-SCFI-2000",
    "NOM-NYCE": "NMX-I-60950-1-NYCE-2015"
}

    normas_visuales_normalizadas = {
    MAPEO_VISUAL_A_NORMA[logo]
    for logo in normas_detectadas_visual
    if logo in MAPEO_VISUAL_A_NORMA
}


    for r in resultados_ia:
        norma = r.get("Norma")

        # VISUAL (YOLO)
        if norma == "Inspección Visual IA":
            for n in r.get("NormasDetectadas", []):
                normas_detectadas_visual.add(n)
            continue

        # TEXTUAL
        if norma:
            evidencias_por_norma.setdefault(norma, []).append(r)

    # =====================================================
    # 🧠 MAPEO VISUAL → NORMA OFICIAL (CLAVE)
    # =====================================================
    MAPEO_VISUAL_A_NORMA = {
        "NOM": "NOM-106-SCFI-2000",
        "NOM-NYCE": "NMX-I-60950-1-NYCE-2015"
    }

    normas_visuales_normalizadas = {
        MAPEO_VISUAL_A_NORMA[n]
        for n in normas_detectadas_visual
        if n in MAPEO_VISUAL_A_NORMA
    }

    # -------------------------------
    # 3. Construir checklist
    # -------------------------------
    for clave_norma, info in normas_catalogo.items():

        # Solo normas aplicables al documento
        if tipo_documento not in info.get("documentos_aplicables", []):
            continue

        evidencias = []

        # TEXTO
        if clave_norma in evidencias_por_norma:
            evidencias.extend(evidencias_por_norma[clave_norma])

        # VISUAL (YOLO → NORMA)
        if clave_norma in normas_visuales_normalizadas:
            evidencias.append({
                "tipo": "visual",
                "descripcion": "Logotipo oficial detectado por inspección visual (YOLO)",
                "fuente": "YOLO"
            })

        # -------------------------------
        # ESTADO FINAL
        # -------------------------------
        if tipo_documento == "Etiqueta":
            estado = (
                "CUMPLE"
                if clave_norma in normas_visuales_normalizadas
                else "NO DETECTADO"
            )
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
