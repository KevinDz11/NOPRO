from backend.services.catalogo_normas import CATALOGO_NORMAS
from backend.services.criterios import CRITERIOS_POR_PRODUCTO


def calcular_score_norma(
    categoria_producto: str,
    tipo_documento: str,
    norma: str,
    evidencias: list
):
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

    resultado = []

    # -------------------------------
    # 1. Obtener catálogo por producto
    # -------------------------------
    normas_catalogo = CATALOGO_NORMAS.get(categoria_producto, {})

    # -------------------------------
    # 2. Agrupar evidencias por norma
    # -------------------------------
    evidencias_por_norma = {}
    normas_detectadas_visual = set()

    for r in resultados_ia:
        norma = r.get("Norma")

        # Evidencia VISUAL (YOLO)
        if norma == "Inspección Visual IA":
            for n in r.get("NormasDetectadas", []):
                normas_detectadas_visual.add(n)
            continue

        # Evidencia TEXTUAL
        if norma:
            evidencias_por_norma.setdefault(norma, []).append(r)

    # -------------------------------
    # 3. Construir checklist
    # -------------------------------
    for clave_norma, info in normas_catalogo.items():

        # ¿Aplica al documento?
        if tipo_documento not in info.get("documentos_aplicables", []):
            continue

        evidencias = []

        # -------------------------------
        # -------------------------------
        # TEXTO (spaCy / regex)
        # -------------------------------
        if clave_norma in evidencias_por_norma:
            evidencias.extend(evidencias_por_norma[clave_norma])

        # -------------------------------
        # VISUAL (YOLO → catálogo)
        # -------------------------------
        if clave_norma in normas_detectadas_visual:
            for ev in info.get("evidencia_esperada", []):
                evidencias.append({
                    "tipo": "visual",
                    "descripcion": ev,
                    "fuente": "YOLO"
                })

        # --------------------------------------------------
        # 🧠 REGLA CLAVE — NORMAS VISUALES EXPLÍCITAS
        # (NOM-106, NYCE, RAEE, etc.)
        # --------------------------------------------------
        if info.get("fuente") == "visual" and clave_norma in normas_detectadas_visual:
            evidencias.append({
                "tipo": "visual",
                "descripcion": "Cumple por detección visual directa (YOLO)",
                "fuente": "YOLO"
            })

        # --------------------------------------------------
        # 🔑 REGLA CLAVE — ETIQUETA MANDA (AQUÍ VA)
        # --------------------------------------------------
        if tipo_documento == "Etiqueta":
            estado = (
                "CUMPLE"
                if clave_norma in normas_detectadas_visual
                else "NO DETECTADO"
            )
        else:
            estado = "CUMPLE" if evidencias else "NO DETECTADO"

        # -------------------------------
        # Resultado final por norma
        # -------------------------------
        resultado.append({
            "norma": clave_norma,
            "nombre": info["nombre"],
            "descripcion": info["descripcion"],
            "documentos_aplicables": info["documentos_aplicables"],
            "evidencia_esperada": info["evidencia_esperada"],
            "estado": estado,
            "score_confianza": round(
                len(evidencias) / max(len(info["evidencia_esperada"]), 1), 2
            ) if evidencias else 0,
            "evidencias": evidencias
        })

    return resultado
