import os
import re
from typing import List, Dict, Any, Optional, Tuple

import pdfplumber
import spacy
from unidecode import unidecode
from backend.services import ia_vision

# --------------------------------------------
# Inicialización spaCy
# --------------------------------------------
print("⏳ Inicializando motor spaCy (es_core_news_md)...")

try:
    nlp = spacy.load("es_core_news_md", disable=["ner"])  # ACTIVAMOS parser + tagger
    if "sentencizer" not in nlp.pipe_names:
        nlp.add_pipe("sentencizer")
    print("✅ Modelo spaCy cargado.")
except:
    print("⚠️ Modelo spaCy no encontrado. Ejecuta: python -m spacy download es_core_news_md")
    nlp = None


# ============================================================
# TABLA DE REGLAS (NO SE MODIFICA)
# ============================================================
CRITERIOS_POR_PRODUCTO: Dict[str, Dict[str, Dict[str, List[Dict[str, Any]]]]] = {
    # ------------ LUMINARIA ------------
    "Luminaria": {
        "Ficha": {
            "NOM-031-ENER-2019": [
                {
                    "id": "eficacia_luminosa_>99",
                    "descripcion": "Eficacia luminosa mayor a 99 lm/W.",
                    "core_terms": ["lm/w", "eficacia", "lumen", "lmw"],
                    "context_terms": ["nom-031", "lm-79"],
                    "numeric_rule": {
                        "type": "min_value",
                        "unit_patterns": ["lm/w", "lmw"],
                        "min": 99
                    }
                },
                {
                    "id": "factor_potencia",
                    "descripcion": "Factor de potencia >= 0.89.",
                    "core_terms": ["fp", "factor", "pf"],
                    "context_terms": [],
                    "numeric_rule": {
                        "type": "min_value",
                        "unit_patterns": ["fp", "pf"],
                        "min": 0.89
                    }
                },
                {
                    "id": "grado_proteccion_ip",
                    "descripcion": "Grado de protección IP20–IP65.",
                    "core_terms": ["ip20", "ip54", "ip65", "grado", "proteccion"],
                    "context_terms": []
                }
            ]
        },
        "Manual": {
            "NMX-J-507/2-ANCE-2013": [
                {
                    "id": "instrucciones_instalacion",
                    "descripcion": "Instrucciones de instalación y diagramas.",
                    "core_terms": ["instalacion", "montaje", "diagrama"],
                    "context_terms": ["manual"]
                },
                {
                    "id": "advertencias",
                    "descripcion": "Advertencias de seguridad eléctrica.",
                    "core_terms": ["desconecte", "riesgo", "humedad"],
                    "context_terms": []
                }
            ]
        }
    },

    # ------------ SMARTTV ------------
    "SmartTV": {
        "Ficha": {
            "NOM-001-SCFI-2018": [
                {"id": "tension_frecuencia_potencia",
                 "descripcion": "Tensión, frecuencia, potencia.",
                 "core_terms": ["voltaje", "tension", "hz", "w", "potencia"],
                 "context_terms": []}
            ],
            "NMX-I-60065-NYCE-2015": [
                {"id": "corriente_fuga",
                 "descripcion": "Corriente de fuga, aislamiento.",
                 "core_terms": ["fuga", "aislamiento", "mω", "megaohm"],
                 "context_terms": []}
            ],
            "NMX-I-60950-1-NYCE-2015": [
                {"id": "puertos_interfaces_tv",
                 "descripcion": "Conectividad USB/HDMI/Ethernet.",
                 "core_terms": ["usb", "hdmi", "ethernet", "puerto"],
                 "context_terms": []}
            ],
            "NOM-032-ENER-2013": [
                {"id": "modos_consumo_tv",
                 "descripcion": "Consumo en modos SDR/HDR/4K y standby.",
                 "core_terms": ["standby", "modo", "consumo", "energia"],
                 "context_terms": []}
            ],
            "NOM-192-SCFI/SCT1-2013": [
                {"id": "conectividad_inalambrica_tv",
                 "descripcion": "WiFi, BT, bandas de operación.",
                 "core_terms": ["wifi", "bluetooth", "2.4", "5ghz"],
                 "context_terms": []}
            ]
        },
        "Manual": {
            "NOM-001-SCFI-2018": [
                {"id": "advertencias_electricas_tv",
                 "descripcion": "Advertencias: no abrir, desconectar.",
                 "core_terms": ["no abrir", "desconectar", "choque"],
                 "context_terms": []}
            ],
            "NMX-I-60065-NYCE-2015": [
                {"id": "ventilacion_tv",
                 "descripcion": "Ventilación y sobrecalentamiento.",
                 "core_terms": ["ventilacion", "calor", "temperatura"],
                 "context_terms": []}
            ],
            "NOM-032-ENER-2013": [
                {"id": "modo_eco_tv",
                 "descripcion": "Modo ECO.",
                 "core_terms": ["eco", "ahorro", "energia"],
                 "context_terms": []}
            ],
            "NOM-192-SCFI/SCT1-2013": [
                {"id": "configuracion_red_tv",
                 "descripcion": "Configuración de red/antenas.",
                 "core_terms": ["wifi", "red", "bt", "bluetooth"],
                 "context_terms": []}
            ]
        }
    },

    # ------------ LAPTOP ------------
    "Laptop": {
        "Ficha": {
            "NMX-I-60950-1-NYCE-2015": [
                {
                    "id": "prueba_dielectrica_3000v",
                    "descripcion": "Prueba dieléctrica >2500 V.",
                    "core_terms": ["3000", "3kv", "dielec", "aislamiento"],
                    "context_terms": [],
                    "numeric_rule": {
                        "type": "min_value",
                        "unit_patterns": ["v", "vac"],
                        "min": 2500
                    }
                },
                {
                    "id": "material_ul94_v0",
                    "descripcion": "Material ignífugo UL94 V-0.",
                    "core_terms": ["ul94", "v0", "v-0"],
                    "context_terms": []
                },
                {
                    "id": "distancia_aislamiento_2_5mm",
                    "descripcion": "Aislamiento >2.5 mm.",
                    "core_terms": ["2.5", "mm", "aislamiento"],
                    "context_terms": []
                },
                {
                    "id": "proteccion_termica_70c",
                    "descripcion": "Protección térmica a 70°C.",
                    "core_terms": ["70", "°c", "termica", "centrigrados"],
                    "context_terms": []
                },
                {
                    "id": "prueba_caida",
                    "descripcion": "Prueba de caída libre.",
                    "core_terms": ["caida", "impacto", "1m"],
                    "context_terms": []
                }
            ],
            "NOM-008-SCFI-2002": [
                {"id": "materiales_laptop",
                 "descripcion": "Materiales del producto.",
                 "core_terms": ["abs", "aluminio", "plastico", "carcasa"],
                 "context_terms": []},
                {"id": "vida_util_laptop",
                 "descripcion": "Vida útil/ durabilidad.",
                 "core_terms": ["vida util", "durabilidad", "ciclos"],
                 "context_terms": []}
            ],
            "NOM-024-SCFI-2013": [
                {"id": "especificaciones_tecnicas_laptop",
                 "descripcion": "CPU, RAM, SSD, pantalla.",
                 "core_terms": ["cpu", "ram", "ssd", "hdd", "pantalla"],
                 "context_terms": []},
                {"id": "certificaciones_laptop",
                 "descripcion": "Certificaciones varias.",
                 "core_terms": ["ce", "ul", "nyce", "rohs"],
                 "context_terms": []}
            ]
        },
        "Manual": {
            "NMX-I-60950-1-NYCE-2015": [
                {"id": "seguridad_laptop_manual",
                 "descripcion": "Advertencias: humedad, líquidos, desconexión.",
                 "core_terms": ["humedad", "liquidos", "desconectar", "limpiar"],
                 "context_terms": []}
            ],
            "NOM-008-SCFI-2002": [
                {"id": "garantia_laptop",
                 "descripcion": "Garantía: periodo y cobertura.",
                 "core_terms": ["garantia", "cobertura", "defectos"],
                 "context_terms": []}
            ],
            "NOM-024-SCFI-2013": [
                {"id": "instrucciones_uso_laptop",
                 "descripcion": "Instrucciones de uso/configuración.",
                 "core_terms": ["instalar", "configurar", "manual"],
                 "context_terms": []}
            ]
        }
    }
}

# ============================================================
# 🔥 NUEVAS FUNCIONES DE LEMMA + RECORTE DE CONTEXTO
# ============================================================

def normalizar_texto_basico(texto: str) -> str:
    if not texto:
        return ""
    return unidecode(texto.lower()).strip()


def normalizar_token(token) -> str:
    return unidecode(token.lemma_.lower())


def obtener_lemmas_de_oracion(sent):
    """
    Devuelve una lista de lemmas normalizados.
    """
    return [normalizar_token(tok) for tok in sent if not tok.is_space]


def recortar_contexto(sent, term, window=25):
    """
    Devuelve un fragmento de contexto alrededor del término detectado.
    """
    texto = sent.text
    palabras = texto.split()
    palabras_norm = [normalizar_texto_basico(p) for p in palabras]

    term_norm = normalizar_texto_basico(term)

    try:
        idx = next(i for i, p in enumerate(palabras_norm) if term_norm in p)
    except StopIteration:
        return texto[:300] + "..."

    ini = max(0, idx - window)
    fin = min(len(palabras), idx + window)

    return " ".join(palabras[ini:fin])


def extraer_documento_spacy(ruta_pdf: str):
    paginas = []
    if nlp is None:
        return paginas

    with pdfplumber.open(ruta_pdf) as pdf:
        for i, pagina in enumerate(pdf.pages):
            txt = pagina.extract_text()
            if not txt or len(txt) < 10:
                continue

            doc = nlp(" ".join(txt.split()))
            paginas.append({
                "pagina": i + 1,
                "texto": txt,
                "doc_spacy": doc
            })
    return paginas


def _contar_hits_terminos(sent, terms):
    if not terms:
        return 0

    lemmas = obtener_lemmas_de_oracion(sent)
    return sum(1 for t in terms if normalizar_texto_basico(t) in lemmas)


def _extraer_numeros_y_unidades(sent):
    resultados = []
    tokens = list(sent)
    for i, tok in enumerate(tokens):
        if tok.like_num:
            raw = tok.text.replace(",", ".")
            try:
                valor = float(re.findall(r"[\d\.]+", raw)[0])
            except:
                continue

            unidad = " ".join(tokens[j].text for j in range(i + 1, min(len(tokens), i + 3)))
            resultados.append((valor, normalizar_texto_basico(unidad.strip())))

    return resultados


def _cumple_regla_numerica(rule, sent):
    if not rule:
        return False, None

    valores = _extraer_numeros_y_unidades(sent)
    if not valores:
        return False, None

    for valor, unidad in valores:
        if any(p in unidad for p in rule["unit_patterns"]):
            if rule["type"] == "min_value" and valor >= rule["min"]:
                return True, f"{valor} >= {rule['min']}"

    return False, None


def evaluar_requisito_en_sentencia(requisito, sent):
    core_hits = _contar_hits_terminos(sent, requisito.get("core_terms", []))
    context_hits = _contar_hits_terminos(sent, requisito.get("context_terms", []))
    min_core = requisito.get("min_core_hits", 1)
    min_ctx = requisito.get("min_context_hits", 0)

    info = {
        "core_hits": core_hits,
        "context_hits": context_hits,
        "numeric_info": None,
    }

    if core_hits < min_core or context_hits < min_ctx:
        return False, info

    numeric_rule = requisito.get("numeric_rule")
    if numeric_rule:
        ok_num, detail = _cumple_regla_numerica(numeric_rule, sent)
        info["numeric_info"] = detail
        if not ok_num:
            return False, info

    return True, info


def analizar_documento(ruta_pdf, tipo_doc, categoria_producto, marca_esperada=None):
    resultados = []

    # =====================================================
    # ANALISIS DE TEXTO (FICHA / MANUAL)
    # =====================================================
    if tipo_doc != "Etiqueta":
        prod = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {})
        normas = prod.get(tipo_doc, {})

        paginas = extraer_documento_spacy(ruta_pdf)

        for pagina in paginas:
            doc = pagina["doc_spacy"]
            num = pagina["pagina"]

            for norma, requisitos in normas.items():
                for req in requisitos:

                    for sent in doc.sents:
                        cumple, info = evaluar_requisito_en_sentencia(req, sent)
                        if not cumple:
                            continue

                        lemmas = obtener_lemmas_de_oracion(sent)

                        core_detectados = [
                            t for t in req.get("core_terms", [])
                            if normalizar_texto_basico(t) in lemmas
                        ]

                        ctx_detectados = [
                            t for t in req.get("context_terms", [])
                            if normalizar_texto_basico(t) in lemmas
                        ]

                        partes = []
                        if core_detectados:
                            partes.append(", ".join(core_detectados))
                        if ctx_detectados:
                            partes.append("ctx: " + ", ".join(ctx_detectados))
                        if info.get("numeric_info"):
                            partes.append("num: " + info["numeric_info"])

                        patron_final = " | ".join(partes) if partes else "N/A"

                        # ------------------------------
                        # RECORTE DE CONTEXTO
                        # ------------------------------
                        term_crop = core_detectados[0] if core_detectados else (
                            ctx_detectados[0] if ctx_detectados else None
                        )

                        if term_crop:
                            contexto = recortar_contexto(sent, term_crop, window=25)
                        else:
                            contexto = sent.text[:300] + "..."

                        resultados.append({
                            "Norma": norma,
                            "Categoria": tipo_doc,
                            "Producto": categoria_producto,
                            "RequisitoID": req["id"],
                            "DescripcionRequisito": req.get("descripcion", ""),
                            "Pagina": num,
                            "Contexto": contexto,
                            "Hallazgo": patron_final,
                            "Razonamiento": str(info),
                        })

                        break  # pasar al siguiente requisito

    # =====================================================
    # ANALISIS VISUAL (IMAGEN)
    # =====================================================
    else:
        print("👁️ [VISIÓN] Analizando Etiqueta...")

        try:
            vis = ia_vision.analizar_imagen_pdf(ruta_pdf)

            yolo = vis.get("yolo_detections", [])
            google = vis.get("google_detections", [])
            logos = list(set(yolo + google))

            if logos:
                resultados.append({
                    "Norma": "Etiquetado (Visual)",
                    "Categoria": "Logos",
                    "Hallazgo": ", ".join(logos),
                    "Pagina": 1,
                    "Contexto": "Detección visual de certificaciones."
                })
            else:
                resultados.append({
                    "Norma": "Etiquetado (Visual)",
                    "Categoria": "Logos",
                    "Hallazgo": "No detectados",
                    "Pagina": 1,
                    "Contexto": "Sin logos reconocidos."
                })

            img_b64 = vis.get("image_base64")
            if img_b64:
                resultados.append({
                    "Norma": "Evidencia Gráfica",
                    "Categoria": "Análisis de Imagen",
                    "Hallazgo": "Detección de Objetos",
                    "Pagina": 1,
                    "Contexto": "Visualización de zonas detectadas por la IA.",
                    "ImagenBase64": img_b64
                })

        except Exception as e:
            resultados.append({
                "Norma": "Error Sistema",
                "Categoria": "Fallo en Visión",
                "Hallazgo": str(e),
                "Pagina": 0,
                "Contexto": "Ocurrió un error al procesar la etiqueta."
            })

    return resultados
