import pdfplumber
import re
import spacy
from unidecode import unidecode
from backend.services import ia_vision
import os

# =========================================================================
#  CONFIGURACIÓN SPACY (LAZY LOADING)
# =========================================================================
_nlp_instance = None

def get_nlp():
    """Carga el modelo spaCy solo cuando se necesita."""
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

# =========================================================================
#  BASE DE DATOS DE CRITERIOS (CEREBRO MAESTRO)
# =========================================================================
# Se mantiene intacta tu base de datos de patrones
CRITERIOS_POR_PRODUCTO = {
    "Laptop": {
        "Ficha": {
            "NMX-I-60950-1-NYCE-2015": {
                "Seguridad eléctrica y desempeño": [
                    r"resistencia (diel[ée]ctrica|de aislamiento).{0,20}3[,\.]000 ?v",
                    r"prueba(s)? (diel[ée]ctrica|de aislamiento).{0,20}1 ?minuto",
                    r"material(es)? ign[íi]fug(os|a).{0,10}ul[- ]?94 ?v-0",
                    r"distancia (mínima )?de aislamiento.{0,10}2\.?5 ?mm",
                    r"protecci[oó]n t[ée]rmica.{0,20}(sensor|desconexi[oó]n|interruptor)",
                    r"desconect(a|e).{0,10}70 ?°c",
                    r"prueba(s)? de (corto ?circuito|sobrecorriente|fuga de corriente)",
                    r"prueba(s)? de estabilidad mec[aá]nica.{0,20}ca[ií]da libre",
                    r"(sin|no presenta) da[ñn]o (funcional|estructural)"
                ]
            },
            "NOM-008-SCFI-2002": {
                "Unidades y etiquetado comercial": [
                    r"unidad(es)? de medida.{0,20}(kg|g|°c|v|w|%|hz)",
                    r"(longitud|masa|temperatura|tiempo|corriente|voltaje).{0,20}(expresad[ao]s?|indicad[ao]s?) en",
                    r"etiqueta.*(unidad(es)? de medida|valores nominales)",
                    r"valores nominales?.{0,20}(voltaje|corriente|frecuencia|potencia)",
                    r"informaci[oó]n cuantitativa.*?(sistema internacional|s\.?i\.?)"
                ]
            },
            "NOM-024-SCFI-2013": {
                "Información técnica y comercial": [
                    r"(procesador|cpu).{0,20}(intel|amd|apple|modelo|frecuencia|n[úu]cleos)",
                    r"(gpu|gr[aá]ficos?).{0,20}(integrada|dedicada|modelo|frecuencia)",
                    r"memoria.{0,20}(ram|ddr\d|capacidad|gb)",
                    r"almacenamiento.{0,20}(ssd|hdd|sata|nvme|capacidad)",
                    r"bater[ií]a.{0,30}(capacidad nominal|wh|ion de litio|li-ion|duraci[oó]n)",
                    r"(dimensiones|peso).{0,20}\d+.*?(mm|g|cm)",
                    r"certificaci[oó]n(es)?.{0,20}(nyce|ce|ul|energy ?star|rohs|fcc)",
                    r"(compatible|soporta).{0,20}(windows|linux|macos)",
                    r"(perif[eé]rico|dock|monitor|adaptador usb[- ]?c)",
                    r"manual de usuario|instrucciones de instalaci[oó]n",
                    r"(nombre|raz[oó]n social) del (fabricante|importador)",
                    r"n[uú]mero de serie|modelo del producto"
                ]
            }
        },
        "Manual": {
            "NOM-019-SE-2021": {
                "Marcado de seguridad": [
                    "doble aislamiento", "aislamiento reforzado", "protección contra descargas",
                    "marcado CE", "símbolo de tierra", "riesgo eléctrico", "descarga eléctrica",
                    "seguridad eléctrica", "aislante", "pictograma de advertencia"
                ],
                "Especificaciones eléctricas": [
                    "corriente máxima", "tensión nominal", "voltaje de operación", "frecuencia",
                    "consumo de energía", "potencia nominal", "amperaje", "eficiencia energética",
                    "capacidad de carga", "factor de potencia"
                ],
                "Advertencias visibles": [
                    "alto voltaje", "no abrir", "precaución", "advertencia",
                    "riesgo de choque eléctrico", "mantener fuera del alcance de niños",
                    "riesgo de incendio", "superficie caliente", "no exponer al agua",
                    "solo personal autorizado", "riesgo de descarga"
                ]
            },
            "NMX-I-60950-1-NYCE-2015": {
                "Instrucciones de seguridad": [
                    "conexión a tierra", "toma de tierra", "puesta a tierra",
                    "ventilación adecuada", "no bloquear rejillas", "mantener alejado de niños",
                    "desconectar antes de limpiar", "evitar humedad", "no utilizar en exteriores",
                    "instalación segura", "precauciones de seguridad"
                ],
                "Especificaciones técnicas": [
                    "sobretensiones", "picos de voltaje", "protector contra sobrecarga",
                    "fusible de protección", "compatibilidad con UPS", "supresor de picos",
                    "corriente de fuga", "límites de potencia", "tolerancia térmica",
                    "modo de fallo seguro"
                ],
                "Mantenimiento": [
                    "mantener seco", "no abrir el equipo", "usar solo el cargador original",
                    "limpieza con paño seco", "no utilizar solventes", "revisión periódica",
                    "desconectar antes de mantenimiento", "revisión por técnico autorizado"
                ]
            },
            "NOM-008-SCFI-2002": {
                "Composición y vida útil": [
                    "plástico ABS", "policarbonato", "vida útil estimada", "resistente a golpes",
                    "material no tóxico", "carcasa ignífuga", "durabilidad", "resistencia mecánica",
                    "reciclable", "cumple con RoHS"
                ],
                "Instrucciones de uso seguro": [
                    "mantener al menos 10 cm", "uso en interiores", "no cubrir el equipo",
                    "no exponer al sol", "no utilizar cerca de agua", "uso adecuado",
                    "temperatura de operación", "colocar sobre superficie estable",
                    "no insertar objetos extraños"
                ],
                "Limitaciones de modificación": [
                    "no modificar", "sin autorización", "no manipular circuitos internos",
                    "no cambiar piezas originales", "no reparar por cuenta propia"
                ],
                "Información de homologación": [
                    "IFT", "cumple normativa", "certificación NOM", "cumple con estándares",
                    "autorizado por NYCE", "registro ante autoridad", "cumple con regulaciones mexicanas"
                ]
            },
            "Información complementaria requerida": {
                "Especificaciones técnicas": [
                    "procesador", "cpu", "chipset", "memoria ram", "almacenamiento",
                    "disco duro", "ssd", "puertos", "entrada hdmi", "puerto usb",
                    "bluetooth", "wifi", "pantalla", "resolución", "dimensiones", "peso",
                    "consumo eléctrico", "batería", "voltaje de entrada", "eficiencia energética"
                ],
                "Condiciones de garantía": [
                    "garantía", "cobertura", "servicio técnico", "manual de garantía",
                    "centro autorizado", "condiciones de reparación", "plazo de garantía",
                    "soporte posventa", "cambios y devoluciones", "política de servicio"
                ],
                "Instrucciones de uso y seguridad": [
                    "advertencias", "precauciones", "configuración inicial", "instalación",
                    "mantenimiento preventivo", "uso adecuado", "instrucciones del fabricante",
                    "manual de usuario", "uso correcto", "operación segura"
                ]
            }
        }
    },
    "SmartTV": {
        "Ficha": {
            "NOM-001-SCFI-2018": {
                "Seguridad eléctrica": [
                    r"100[-–]?240\s*v(ac)?",
                    r"50\s*/\s*60\s*hz",
                    r"potencia\s+nominal\s+160\s*w",
                    r"≤?\s*0[.,]5\s*w",
                    r"entrada\s+de\s+energ[ií]a",
                    r"condici[oó]n\s+de\s+trabajo",
                    r"clasificaci[oó]n\s+de\s+fuego\s+ul94[- ]?hb75",
                    r"tensi[oó]n",
                    r"corriente"
                ]
            },
            "NMX-I-60065-NYCE-2015": {
                "Seguridad térmica y ventilación": [
                    r"temperatura\s+de\s+operaci[oó]n",
                    r"temperatura\s+de\s+trabajo",
                    r"5[°º]\s*c\s*[-–~]\s*40[°º]\s*c",
                    r"humedad\s*20%\s*[-–~]\s*80%",
                    r"temperatura\s+de\s+almacenamiento",
                    r"condici[oó]n\s+de\s+trabajo"
                ]
            },
            "NMX-I-60950-1-NYCE-2015": {
                "Conexión de periféricos": [
                    r"hdmi\s*2\.0",
                    r"hdcp\s*2\.2",
                    r"usb\s*2\.0",
                    r"rj[- ]?45",
                    r"salida\s+spdif",
                    r"entrada\s+av",
                    r"uhd\s*\(3840\s*x\s*2160\)",
                    r"audio\s+digital",
                    r"video\s+compuesto"
                ],
                "Seguridad en interfaces": [
                    r"interferencia\s+electromagn[eé]tica",
                    r"emisi[oó]n\s+radiada",
                    r"compatibilidad\s+electromagn[eé]tica",
                    r"filtro\s+emi"
                ]
            },
            "NOM-032-ENER-2013": {
                "Eficiencia energética": [
                    r"potencia\s+nominal\s+160\s*w",
                    r"≤?\s*0[.,]5\s*w",
                    r"modo\s+espera",
                    r"stand[- ]?by",
                    r"consumo\s+de\s+energ[ií]a"
                ]
            },
            "NOM-192-SCFI/SCT1-2013": {
                "Conectividad inalámbrica": [
                    r"wi[-]?\s?fi",
                    r"ieee\s*802\.11[a-z/]+",
                    r"2t2r",
                    r"bluetooth\s*5\.1",
                    r"2\.4\s*(ghz)?",
                    r"5[.,]15\s*(ghz)?",
                    r"5[.,]85\s*(ghz)?"
                ],
                "Advertencias RF": [
                    r"interferencia\s+de\s+radio",
                    r"potencia\s+de\s+transmisi[oó]n",
                    r"cumple\s+con\s+ift"
                ]
            },
            "NMX-J-606-ANCE-2008": {
                "Componentes y fusibles": [
                    r"ul94[- ]?hb75",
                    r"clasificaci[oó]n\s+de\s+fuego",
                    r"protecci[oó]n\s+t[eé]rmica",
                    r"resistencia\s+diel[eé]ctrica",
                    r"circuito\s+interno"
                ]
            },
            "NMX-J-640-ANCE-2010": {
                "Identificación y etiquetas": [
                    r"lanix",
                    r"x\s*smart\s*tv\s*mod\.\s*x65",
                    r"etiqueta",
                    r"informaci[oó]n\s+t[eé]cnica"
                ],
                "Durabilidad de marcaje": [
                    r"marcado\s+permanente",
                    r"etiqueta\s+durable",
                    r"marcado\s+indeleble"
                ]
            },
            "NMX-J-551-ANCE-2012": {
                "Cableado y alimentación": [
                    r"cable\s+de\s+poder",
                    r"alimentaci[oó]n",
                    r"entrada\s+de\s+energ[ií]a",
                    r"100[-–]?240\s*v(ac)?"
                ],
                "Recomendaciones de seguridad": [
                    r"no\s+sobrecargue",
                    r"verifique\s+el\s+cableado",
                    r"reemplazo\s+de\s+cable"
                ]
            }
        },
        "Manual": {
            "NOM-001-SCFI-2018": {
                "Seguridad eléctrica": [
                    r"riesgo de descarga",
                    r"riesgo de choque",
                    r"desconecte el televisor",
                    r"no conecte el equipo si esta danado",
                    r"utilice un tomacorriente adecuado",
                    r"no retire la tapa",
                    r"no desensamble el producto",
                    r"conecte el cable de alimentacion",
                    r"proteccion contra sobre(carga|corriente)",
                    r"no modifique el cable",
                    r"no utilice enchufes sueltos"
                ],
                "Advertencias al usuario": [
                    r"no moje el televisor",
                    r"mantenga alejado del agua",
                    r"no exponer el equipo a humedad",
                    r"no coloque objetos encima",
                    r"mantener fuera del alcance de ninos",
                    r"desconecte antes de limpiar",
                    r"utilice accesorios originales",
                    r"no utilizar cerca del calor",
                    r"no introducir objetos en las ranuras"
                ],
                "Servicio y soporte": [
                    r"servicio tecnico autorizado",
                    r"no intente reparar",
                    r"centro de servicio",
                    r"contacte al fabricante",
                    r"garantia",
                    r"asistencia tecnica",
                    r"reparacion solo por personal calificado"
                ]
            },
            "NMX-I-60065-NYCE-2015": {
                "Seguridad térmica y ventilación": [
                    r"no cubra las ranuras",
                    r"mantenga una ventilacion adecuada",
                    r"mantenga espacio alrededor",
                    r"no bloquee las aberturas",
                    r"riesgo de sobrecalentamiento",
                    r"no coloque cerca de fuentes de calor",
                    r"superficie caliente",
                    r"temperatura de operacion"
                ],
                "Conexión y operación segura": [
                    r"conecte correctamente los cables",
                    r"no conecte si esta humedo",
                    r"no manipule el cable danado",
                    r"evite sobrecargar la toma",
                    r"adaptadores certificados",
                    r"asegure la conexion del cable"
                ],
                "Mantenimiento preventivo": [
                    r"limpie con pano suave",
                    r"no use solventes",
                    r"mantenimiento periodico",
                    r"inspeccion por tecnico autorizado",
                    r"retire el polvo",
                    r"desconecte antes de limpiar"
                ]
            },
            "NMX-I-60950-1-NYCE-2015": {
                "Conexión de periféricos": [
                    r"conecte el dispositivo usb",
                    r"puertos usb",
                    r"conexion ethernet",
                    r"puerto hdmi",
                    r"cable original",
                    r"dispositivos danados",
                    r"entrada av",
                    r"salida optica",
                    r"audio digital"
                ],
                "Seguridad en interfaces": [
                    r"proteccion de puertos",
                    r"descargas electrostaticas",
                    r"pruebas de esd",
                    r"aislamiento de senal",
                    r"manejo de conectores",
                    r"no forzar el conector"
                ],
                "Instrucciones generales": [
                    r"instale correctamente",
                    r"precauciones de montaje",
                    r"manual de usuario",
                    r"no utilizar en exteriores sin proteccion"
                ]
            },
            "NOM-032-ENER-2013": {
                "Eficiencia energética": [
                    r"modo eco",
                    r"modo ahorro",
                    r"modo stand ?by",
                    r"consumo en espera",
                    r"ahorre energia",
                    r"apagado automatico",
                    r"reduzca el brillo",
                    r"uso eficiente de energia"
                ],
                "Consejos al usuario": [
                    r"desconecte el televisor cuando no lo use",
                    r"optimice el consumo",
                    r"apague funciones no utilizadas",
                    r"active el ahorro de energia"
                ]
            },
            "NOM-192-SCFI/SCT1-2013": {
                "Conectividad inalámbrica": [
                    r"configuracion de red",
                    r"wifi",
                    r"bluetooth",
                    r"sintonizador digital",
                    r"frecuencia de operacion",
                    r"conexion inalambrica"
                ],
                "Advertencias RF": [
                    r"mantenga distancia",
                    r"no cubra las antenas",
                    r"interferencia electromagnetica",
                    r"potencia de transmision",
                    r"cumple con ift"
                ]
            },
            "NMX-J-606-ANCE-2008": {
                "Componentes y fusibles": [
                    r"fusible de proteccion",
                    r"circuito interno",
                    r"proteccion termica",
                    r"personal calificado",
                    r"componentes internos"
                ],
                "Compatibilidad y accesorios": [
                    r"accesorios compatibles",
                    r"adaptador compatible",
                    r"proteccion contra cortocircuito",
                    r"tolerancia electrica"
                ]
            },
            "NMX-J-640-ANCE-2010": {
                "Identificación y etiquetas": [
                    r"modelo",
                    r"numero de serie",
                    r"informacion del producto",
                    r"etiqueta",
                    r"fabricante",
                    r"datos tecnicos"
                ],
                "Durabilidad de marcaje": [
                    r"marcado permanente",
                    r"etiqueta legible",
                    r"ubicada en la parte posterior"
                ]
            },
            "NMX-J-551-ANCE-2012": {
                "Cableado y alimentación": [
                    r"cable de alimentacion",
                    r"cable de poder",
                    r"no doblar el cable",
                    r"voltaje adecuado",
                    r"extensiones seguras",
                    r"reemplazo de cable"
                ],
                "Recomendaciones de seguridad": [
                    r"no usar cables danados",
                    r"no jalar el cable",
                    r"revisar el cableado",
                    r"uso correcto del cable"
                ]
            }
        }
    },
    "Luminaria": {
        "Ficha": {
            "NMX-J-038/1-ANCE-2005": {
                "Verificación de desempeño y seguridad eléctrica": [
                    "pruebas a 60 hz", "ensayos a 60hz", "condiciones mexicanas",
                    "seguridad eléctrica", "cumplimiento de pruebas", "ensayos eléctricos",
                    "corriente de fuga", "resistencia dieléctrica", "pruebas de laboratorio",
                    "evaluación eléctrica", "pruebas de seguridad", "prueba dieléctrica"
                ],
                "Condiciones térmicas y de tensión nacional": [
                    "variación de tensión", "variación de voltaje", "protección térmica",
                    "temperatura de operación", "tensión nominal", "sobretensión",
                    "tensión sin carga", "thermal protection", "thermal shutdown",
                    "rango de voltaje", "derating", "operación continua"
                ]
            },
            "NOM-031-ENER-2019": {
                "Eficacia luminosa (lm/w)": [
                    "eficacia luminosa", "lm/w", "lúmenes por vatio", "rendimiento luminoso",
                    "eficiencia lumínica", "eficacia lumínica", ">99 lm/w", "lmw",
                    "performance lumínico", "eficiencia óptica", "luminous efficacy",
                    "148 lm/w", "eficiencia del luminario"
                ],
                "Factor de potencia y pérdidas": [
                    "factor de potencia", "fp", ">0.89", ">0.90", "pérdidas eléctricas",
                    "lm-79", "eficiencia energética", "power factor", "pf",
                    "distorsión armónica", "pérdidas del driver", "driver efficiency"
                ],
                "Flujo luminoso y distribución": [
                    "flujo luminoso nominal", "lm output", "lúmenes", "distribución luminosa",
                    "índice g", "uniformidad", "curva fotométrica", "iesna",
                    "tipo i", "tipo ii", "tipo iii", "tipo iv", "tipo v",
                    "photometric distribution", "beam pattern", "beam angle"
                ],
                "Curvas fotométricas (.ies o .ldt)": [
                    ".ies", ".ldt", "archivo ies", "archivo digital", "fotometría",
                    "curva fotométrica", "lm-79", "lm-75", "fotometrías",
                    "C0/C90", "C0/C180", "intensidad lumínica", "cd/100lm",
                    "archivo fotométrico", "IES file"
                ],
                "Temperatura de color y CRI": [
                    "temperatura de color", "cct", "cri", "índice de reproducción cromática",
                    "blanco cálido", "blanco neutro", "4000k", "5000k", "6500k",
                    "color rendering index", "chromaticity", "CCT <3999K"
                ]
            },
            "NMX-J-507/2-ANCE-2013": {
                "Parámetros eléctricos": [
                    "tensión", "voltaje", "corriente", "pérdidas", "thd",
                    "distorsión armónica total", "condiciones de prueba",
                    "ensayo eléctrico", "frecuencia", "driver", "120-277v",
                    "347/480v", "consumo eléctrico", "watts", "wattage"
                ],
                "Ciclos de encendido": [
                    "1500 ciclos", "encendido", "apagado", "ciclos on/off",
                    "vida útil de encendido", "durabilidad", "switching cycles"
                ]
            },
            "NMX-J-543-ANCE-2013": {
                "Ensayos eléctricos": [
                    "resistencia dieléctrica", "corriente de fuga", "sobrecorriente",
                    "sobretemperatura", "4000 v rms", "0.5 ma", "prueba de aislamiento",
                    "pruebas eléctricas", "ensayo eléctrico", "laboratorio acreditado",
                    "dielectric test", "high-pot test"
                ],
                "Compatibilidad y vida útil": [
                    "10,000 ciclos", "resistencia a impactos", "ik08", "0.7 j",
                    "impacto mecánico", "vibración 3g", "vida útil", "compatibilidad",
                    "resistencia mecánica", "shock resistance", "vibration test"
                ]
            },
            "NMX-J-610/4-5-ANCE-2013": {
                "Aislamiento eléctrico y térmico": [
                    "aislamiento eléctrico", "aislamiento térmico", "10 mΩ",
                    "4000 v rms", "ensayo dieléctrico", "prueba de aislamiento",
                    "thermal insulation", "electrical insulation"
                ],
                "Prueba de envejecimiento": [
                    "1000 horas", "operación continua", "envejecimiento",
                    "prueba prolongada", "life test", "aging test", "TM-21", "LM-80"
                ],
                "Evaluación fotobiológica": [
                    "fotobiológica", "rg0", "rg1", "iec 62471", "riesgo ocular",
                    "riesgo fotobiológico", "photobiological safety"
                ],
                "Grado de protección IP": [
                    "ip20", "ip65", "ip66", "grado de protección", "hermeticidad",
                    "índice de protección", "protección ik", "ik08", "resistencia al polvo",
                    "resistencia al agua", "waterproof", "dustproof"
                ]
            },
            "NOM-030-ENER-2016": {
                "Eficiencia energética y pérdidas totales": [
                    "eficiencia energética", "pérdidas totales", "límites de eficiencia",
                    "potencia nominal", "ahorro de energía", "energy efficiency",
                    "consumo", "wattage", "eficiencia del sistema"
                ]
            },
            "NOM-024-ENER-2016": {
                "Compatibilidad y control inteligente": [
                    "eficacia mínima", "vida útil", "sensores", "dimmers",
                    "1-10v", "dali", "zigbee", "controladores inteligentes",
                    "protocolo", "photocell", "nema 3 pins", "nema 7 pins",
                    "smart control", "wireless", "dimming", "atenuación"
                ]
            }
        },
        "Manual": {
            "NMX-J-507/2-ANCE-2013": {
                "Métodos de prueba fotométricos": [
                    "fotometría", "pruebas fotométricas", "ensayo LM-79", "curva fotométrica",
                    "distribución luminosa", "patrón de iluminación", "haz luminoso", "ángulo de haz",
                    "eficiencia luminosa", "rendimiento luminoso", "flujo luminoso", "lúmenes",
                    "intensidad luminosa", "candelas", "temperatura de color", "CCT", "CRI",
                    "IEC 60598", "archivo IES", "archivo LDT", "curva polar", "diagrama fotométrico"
                ],
                "Instalación y montaje": [
                    "instalación del luminario", "montaje", "altura de instalación", "altura de montaje",
                    "alineación del haz", "orientación del luminario", "ángulo de inclinación",
                    "soporte mecánico", "bracket", "abrazadera", "anclaje", "perno de fijación",
                    "distancias mínimas", "estructura de soporte", "vibraciones", "protección exterior",
                    "montaje en poste", "montaje en pared", "montaje suspendido"
                ],
                "Advertencias y mantenimiento": [
                    "desconectar antes de abrir", "corte de energía", "riesgo eléctrico",
                    "no exponer a humedad", "superficie caliente", "riesgo de quemaduras",
                    "limpieza del difusor", "limpieza óptica", "mantenimiento preventivo",
                    "reemplazo de módulo", "vida útil", "degradación lumínica", "LM-80",
                    "inspección visual", "verificación periódica", "riesgo de incendio"
                ]
            },
            "NMX-J-543-ANCE-2013": {
                "Conectadores eléctricos": [
                    "conector", "conectador", "terminal eléctrica", "terminal de conexión",
                    "enchufe", "contacto eléctrico", "punto de conexión", "aislamiento",
                    "corriente máxima", "tensión nominal", "tensión hasta 35 kV",
                    "resistencia de contacto", "torque de terminal", "borne", "clamp",
                    "seguridad eléctrica", "compatibilidad eléctrica"
                ],
                "Seguridad eléctrica": [
                    "riesgo de descarga eléctrica", "protección contra arco", "arco eléctrico",
                    "distancia de seguridad", "distancia libre", "distancia de fuga",
                    "sobretensión", "protección contra sobrecorriente", "aislamiento reforzado",
                    "protección contra choque eléctrico", "advertencia eléctrica",
                    "etiqueta de advertencia", "trabajo con tensión", "uso autorizado"
                ],
                "Documentación de instalación": [
                    "manual de instalación", "manual técnico", "guía de instalación",
                    "diagrama de conexión", "esquema eléctrico", "hoja técnica",
                    "certificación", "documentación técnica", "registro de torque",
                    "inspección periódica", "procedimiento de instalación"
                ]
            },
            "NMX-J-610/4-5-ANCE-2013": {
                "Compatibilidad electromagnética (EMC)": [
                    "compatibilidad electromagnética", "EMC", "EMI", "interferencia electromagnética",
                    "distorsión armónica", "THD", "armónicos", "inmunidad a impulsos",
                    "transitorios eléctricos", "sobretensiones transitorias", "surge protection",
                    "descarga atmosférica", "protección contra picos", "IEC 61000-4-5",
                    "técnicas de medición", "campo electromagnético perturbado", "ruido eléctrico"
                ],
                "Instalación del luminario eléctrico": [
                    "alimentación eléctrica", "tensión de operación", "voltaje nominal", "voltaje de entrada",
                    "corriente de operación", "frecuencia 50/60 Hz", "factor de potencia", "PF",
                    "puesta a tierra", "grounding", "conexión equipotencial", "protección contra sobrecorriente",
                    "fusible", "protección térmica", "blindaje EMI", "filtro EMI"
                ]
            },
            "NOM-030-ENER-2016": {
                "Eficiencia energética lámparas LED integradas": [
                    "eficiencia energética", "eficacia luminosa", "lm/W", "lúmenes por vatio",
                    "flujo luminoso total", "lúmenes iniciales", "vida útil nominal", "L70",
                    "temperatura de color correlacionada", "CCT", "índice de reproducción cromática",
                    "CRI", "IRC", "tensión 100-277 V", "frecuencia 50/60 Hz",
                    "clasificación de lámparas", "ahorro de energía", "consumo eléctrico"
                ],
                "Marcado e información del producto": [
                    "marca del fabricante", "modelo", "tensión de entrada", "potencia nominal",
                    "potencia consumida", "flujo luminoso", "fecha de fabricación",
                    "etiqueta energética", "etiqueta de eficiencia", "información del empaque",
                    "garantía mínima 3 años", "número de serie", "datos de fabricación"
                ],
                "Pruebas y procedimientos de conformidad": [
                    "laboratorio acreditado", "informe de pruebas", "prueba LM-79",
                    "estabilización térmica", "ensayo de flujo inicial", "ensayo de 1 000 h",
                    "seguimiento de producción", "certificación NOM", "pruebas de desempeño",
                    "ensayo de eficacia", "condiciones de prueba"
                ]
            },
            "NOM-024-ENER-2016": {
                "Instalación eficiente de luminarios exteriores": [
                    "altura de montaje", "alineación fotométrica", "sensor de movimiento",
                    "sensor CREPUSCULAR", "fotocélula", "carga conectada", "diseño de alumbrado público",
                    "iluminancia", "niveles de iluminación", "ópticas limpias", "control de atenuación",
                    "diseño sustentable", "sistema de control inteligente", "dimmers compatibles"
                ],
                "Mantenimiento y reemplazo": [
                    "revisión anual", "limpieza de ópticas", "limpieza del difusor",
                    "sustitución por degradación lumínica", ">30% pérdida de flujo",
                    "inspección visual", "registro de mantenimiento", "equipo obsoleto",
                    "reemplazo preventivo", "vida útil reducida"
                ],
                "Advertencias de uso e instalación": [
                    "no usar con dimmers no compatibles", "no exponer a humedad",
                    "riesgo de incendio", "sobrecalentamiento", "superficie caliente",
                    "instalación por personal calificado", "no cubrir luminario",
                    "riesgo eléctrico", "advertencia", "peligro"
                ]
            },
            "Información complementaria requerida": {
                "Especificaciones técnicas": [
                    "voltaje", "tensión", "corriente", "potencia", "energía", "seguridad",
                    "riesgo", "manual", "advertencia", "instalación", "funcionamiento",
                    "operación", "protección", "equipo", "usuario", "conexión",
                    "carcasa", "material", "IP65", "IP67", "temperatura de operación"
                ]
            }
        }
    }
}

# =========================================================================
#  FUNCIONES DE EXTRACCIÓN Y ANÁLISIS
# =========================================================================

def extraer_documento_spacy(ruta_pdf):
    """
    Extrae texto y genera un objeto DOC de spaCy por página.
    """
    docs_paginas = []
    nlp = get_nlp() # <--- LAZY LOADING: Aquí se carga Spacy
    
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
                    
                    docs_paginas.append({
                        "pagina": i+1,
                        "doc_spacy": doc,
                        "original": txt
                    })
    except Exception as e:
        print(f"Error leyendo PDF: {e}")
    return docs_paginas

def analizar_documento(ruta_pdf, tipo_doc, categoria_producto, marca_esperada=None):
    """
    Analiza el documento usando spaCy para estructura y Regex para patrones específicos.
    """
    resultados = []

    # =================================================================
    # 1. ANÁLISIS DE TEXTO (NLP + Regex Híbrido)
    # =================================================================
    if tipo_doc != "Etiqueta":
        print(f"📄 Analizando TEXTO (Motor spaCy) para {tipo_doc} de {categoria_producto}...")
        
        prod_criterios = CRITERIOS_POR_PRODUCTO.get(categoria_producto, {})
        normas_a_buscar = prod_criterios.get(tipo_doc, {})

        if normas_a_buscar:
            # Obtenemos los objetos inteligentes de spaCy
            # Esta función llamará a get_nlp() internamente
            docs_paginas = extraer_documento_spacy(ruta_pdf)
            
            for norma, categorias in normas_a_buscar.items():
                for categoria, lista_patrones in categorias.items():
                    for patron_str in lista_patrones:
                        
                        try:
                            regex_compilado = re.compile(patron_str, re.IGNORECASE)
                        except re.error:
                            continue

                        for pag_data in docs_paginas:
                            doc = pag_data["doc_spacy"]
                            
                            match = regex_compilado.search(doc.text)
                            if match:
                                start_char, end_char = match.span()
                                
                                # Ventana de contexto
                                window_size = 60 
                                start_ctx = max(0, start_char - window_size)
                                end_ctx = min(len(doc.text), end_char + window_size)
                                
                                raw_context = doc.text[start_ctx:end_ctx]
                                contexto_limpio = "..." + raw_context.replace("\n", " ").strip() + "..."

                                resultados.append({
                                    "Norma": norma,
                                    "Categoria": categoria,
                                    "Hallazgo": patron_str[:50] + "..." if len(patron_str)>50 else patron_str,
                                    "Pagina": pag_data["pagina"],
                                    "Contexto": contexto_limpio
                                })
                                break
    else:
        print(f"⏩ OMITIENDO análisis de texto para {tipo_doc} (Se requiere solo Visual).")

    # =================================================================
    # 2. ANÁLISIS VISUAL (Sin cambios, usa IA Vision)
    # =================================================================
    if ruta_pdf.lower().endswith(".pdf") and tipo_doc == "Etiqueta":
        print(f"\n--- 🔍 DEBUG VISUAL (Solo Etiqueta) ---")
        try:
            hallazgos = ia_vision.analizar_imagen_pdf(ruta_pdf)
            yolo_list = hallazgos.get("yolo_detections", [])
            google_list = hallazgos.get("google_detections", [])
            img_base64 = hallazgos.get("image_base64")

            hallazgos_totales = []
            if google_list: hallazgos_totales.extend(google_list)
            if yolo_list: hallazgos_totales.extend(yolo_list)

            if hallazgos_totales:
                hallazgos_str = ", ".join(hallazgos_totales)
                resultados.append({
                    "Norma": "Inspección Visual IA",
                    "Categoria": "Elementos Identificados",
                    "Hallazgo": hallazgos_str,
                    "Pagina": 1,
                    "Contexto": f"Se detectaron textos/logos: {hallazgos_str}"
                })
            else:
                resultados.append({
                    "Norma": "Inspección Visual IA",
                    "Categoria": "Sin Hallazgos Textuales",
                    "Hallazgo": "N/A",
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
            print(f"❌ ERROR CRÍTICO EN ANALISIS.PY (Visual): {e}")
            resultados.append({
                "Norma": "Error Sistema",
                "Categoria": "Fallo en Visión",
                "Hallazgo": str(e),
                "Pagina": 0,
                "Contexto": "Ocurrió un error al procesar la imagen."
            })

    return resultados