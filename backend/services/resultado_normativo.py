import re
from backend.services.catalogo_normas import CATALOGO_NORMAS
from backend.services.criterios import CRITERIOS_POR_PRODUCTO


# =====================================================
# 🔎 UTILIDAD: EXTRAER NOMs DESDE TEXTO / CONTEXTO
# =====================================================
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
    - "NOM-CE" -> "NOM-CE" (se conserva)
    - "NOM CE" -> "NOM-CE"
    - "nyce"   -> "NYCE"
    - "NOM-NYCE" -> "NOM-NYCE"
    """
    if not valor:
        return ""
    v = str(valor).upper().strip()
    v = v.replace("_", "-").replace(" ", "-")

    # ✅ NO convertir NOM-CE a NOM, porque tú pediste que NOM-106 sea SOLO NOM
    if v.startswith("NOM-"):
        return v  # NOM-CE, NOM-NYCE, NOM-UL, etc.

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


# =====================================================
# 📊 SCORE DE CONFIANZA
# =====================================================
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


# =====================================================
# 🧠 CONSTRUCTOR PRINCIPAL DEL CHECKLIST
# =====================================================
def construir_resultado_normativo(
    categoria_producto: str,
    tipo_documento: str,
    resultados_ia: list
):
    """
    Construye el checklist normativo final combinando:
    - Evidencia textual (spaCy + regex)
    - Evidencia visual (YOLO/OCR/Imagen)

    🔥 Ajuste solicitado:
    - NOM-106-SCFI-2000 SOLO detecta 'NOM' (no NOM-CE ni variantes)
    - NMX-I-60950-1-NYCE-2015 detecta: doble aislamiento, choque eléctrico, NOM-CE, NOM-UL, NOM-NYCE, contenido especial
    - NOM-019-SE-2021 detecta: doble aislamiento, NOM-CE, choque eléctrico
    """

    # =====================================================
    # 🧠 NORMALIZACIÓN DEL TIPO DE DOCUMENTO
    # =====================================================
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

    # -------------------------------
    # 1. Catálogo de normas
    # -------------------------------
    normas_catalogo = CATALOGO_NORMAS.get(categoria_producto, {})

    # -------------------------------
    # 2. Agrupar evidencias IA
    # -------------------------------
    evidencias_por_norma = {}
    normas_detectadas_visual = set()
    texto_visual_completo = ""

    for r in resultados_ia or []:
        norma_r = r.get("Norma", "")
        contexto = r.get("Contexto", "") or ""

        # =============================
        # VISUAL (cualquier evidencia visual)
        # =============================
        if es_evidencia_visual(r):
            # Acumular texto visual para reglas por norma
            texto_visual_completo += " " + contexto

            # a) NOMs completas en el contexto (ej. NOM-019-SE-2021)
            for nom in extraer_noms_de_texto(contexto):
                normas_detectadas_visual.add(nom)

            # ✅ b) SOLO agregar 'NOM' genérico si aparece como palabra "NOM" SOLA
            #    (no NOM-CE, no NOM-NYCE, no NOM-UL)
            if re.search(r"(?<![A-Z0-9-])NOM(?![A-Z0-9-])", contexto.upper()):
                normas_detectadas_visual.add("NOM")

            # c) Logos detectados (si existen)
            for n in r.get("NormasDetectadas", []) or []:
                normas_detectadas_visual.add(normalizar_logo_visual(n))
                texto_visual_completo += " " + str(n)

            continue

        # =============================
        # TEXTUAL (spaCy/regex)
        # =============================
        if norma_r:
            evidencias_por_norma.setdefault(norma_r, []).append(r)

    texto_visual_completo = (texto_visual_completo or "").lower()

    # =====================================================
    # ✅ REGLAS VISUALES ESPECÍFICAS (SOLO PARA ETIQUETA)
    # =====================================================
    def regla_nom_106():
        # NOM puro: "NOM" como palabra sola en texto_visual o en set visual
        if "NOM" in normas_detectadas_visual:
            return True
        return bool(re.search(r"(?<![a-z0-9-])nom(?![a-z0-9-])", texto_visual_completo))

    def regla_nmx_60950():
        claves = [
            "doble aislamiento",
            "choque electr",          # choque electrico / eléctr / etc
            "contenido especial",
            "nom-ce",
            "nom-ul",
            "nom-nyce",
        ]
        # si el set trae alguno de estos logos normalizados también cuenta
        if any(x.upper() in normas_detectadas_visual for x in ["NOM-CE", "NOM-UL", "NOM-NYCE"]):
            return True
        return any(k in texto_visual_completo for k in claves)

    def regla_nom_019():
        claves = [
            "doble aislamiento",
            "choque electr",
            "nom-ce",
        ]
        if "NOM-CE" in normas_detectadas_visual:
            return True
        return any(k in texto_visual_completo for k in claves)

    # -------------------------------
    # 3. Construir checklist final
    # -------------------------------
    for clave_norma, info in normas_catalogo.items():

        # Solo normas aplicables al tipo de documento
        if tipo_documento not in info.get("documentos_aplicables", []):
            continue

        evidencias = []

        # -------------------------------
        # TEXTO
        # -------------------------------
        if clave_norma in evidencias_por_norma:
            evidencias.extend(evidencias_por_norma[clave_norma])

        # -------------------------------
        # VISUAL (REGLAS POR NORMA)
        # -------------------------------
        cumple_visual = False

        if tipo_documento == "Etiqueta":
            if clave_norma == "NOM-106-SCFI-2000":
                cumple_visual = regla_nom_106()
            elif clave_norma == "NMX-I-60950-1-NYCE-2015":
                cumple_visual = regla_nmx_60950()
            elif clave_norma == "NOM-019-SE-2021":
                cumple_visual = regla_nom_019()
            else:
                # Para otras normas, si venía la norma completa detectada, también cuenta
                cumple_visual = (clave_norma in normas_detectadas_visual)

            if cumple_visual:
                evidencias.append({
                    "tipo": "visual",
                    "descripcion": "Elemento visual detectado en etiqueta según regla específica",
                    "fuente": "YOLO / OCR"
                })

        # -------------------------------
        # ESTADO FINAL
        # -------------------------------
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

    # DEBUG ÚTIL
    print("🧪 normas_detectadas_visual:", normas_detectadas_visual)
    print("🧪 texto_visual_completo:", texto_visual_completo)

    return resultado
