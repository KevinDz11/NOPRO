"""
CRITERIOS_POR_PRODUCTO
=====================

Este archivo define LOS CRITERIOS TÉCNICOS DE DETECCIÓN
(regex y patrones) que utiliza el motor de análisis IA
para encontrar evidencia normativa dentro de documentos
(Ficha Técnica, Manual, Etiqueta).

NO contiene descripciones normativas
NO contiene texto para el usuario
SOLO contiene patrones de búsqueda (regex)

Se cruza posteriormente con:
- catalogo_normas.py (qué evalúa la norma)
- resultado_normativo.py (estado y score)
"""

CRITERIOS_POR_PRODUCTO = {

    "Laptop": {
        "Ficha": {
           "NOM-001-SCFI-2018": {
    "Seguridad eléctrica": [
        r"voltaje (nominal|de entrada).{0,10}\d+ ?v",
        r"frecuencia.{0,10}(50|60) ?hz",
        r"corriente.{0,10}\d+ ?a",
        r"potencia.{0,10}\d+ ?w",
        r"consumo el[eé]ctrico",
        r"clase de protecci[oó]n",
        r"aislamiento (clase i|clase ii|doble aislamiento)"
    ]
},
           "NOM-019-SE-2021": {
    "Marcado de seguridad": [
        r"doble aislamiento",
        r"s[ií]mbolo de tierra",
        r"marcado ce",
        r"riesgo el[eé]ctrico"
    ]
},

            "NOM-008-SCFI-2002": {

                "Unidades de medida": [
                    r"\d+(\.\d+)?\s*(v|w|hz|a|°c|c|kg|g|mm|cm)",
                    r"valores\s+nominales",
                    r"sistema\s+internacional",
                    r"unidades\s+de\s+medida"
                ]
            },

            "NOM-024-SCFI-2013": {

                "Información técnica y comercial": [
                    r"marca\s*[:=]?\s*\w+",
                    r"modelo\s*[:=]?\s*[\w\-]+",
                    r"(fabricado|hecho)\s+en\s+\w+",
                    r"pais\s+de\s+origen",
                    r"procesador|cpu",
                    r"memoria\s*(ram)?\s*\d+\s*gb",
                    r"almacenamiento\s*(ssd|hdd|nvme)\s*\d+\s*gb",
                    r"tarjeta\s*(gráfica|grafica|gpu)",
                    r"pantalla\s*\d+(\.\d+)?\s*(pulgadas|\"|in)",
                    r"dimensiones\s*\d+.*?(mm|cm)",
                    r"peso\s*\d+(\.\d+)?\s*(kg|g)"
                ]
            }
        },

        "Manual": {
            "NOM-001-SCFI-2018": {

                "Advertencias de seguridad eléctrica": [
                    r"riesgo\s+de\s+(descarga|choque)\s+eléctrica",
                    r"alto\s+voltaje",
                    r"no\s+exponer\s+al\s+agua",
                    r"no\s+abrir",
                    r"precaución|advertencia",
                    r"desconect(e|ar)\s+antes\s+de\s+(limpiar|manipular)"
                ]
            },

            "NOM-019-SE-2021": {

                "Marcado y advertencias de seguridad": [
                    r"símbolo\s+de\s+tierra",
                    r"doble\s+aislamiento",
                    r"protección\s+contra\s+descargas",
                    r"pictograma\s+de\s+advertencia",
                    r"riesgo\s+eléctrico",
                    r"seguridad\s+eléctrica"
                ],

                "Uso y mantenimiento": [
                    r"instrucciones\s+de\s+uso",
                    r"uso\s+adecuado",
                    r"mantenimiento",
                    r"limpieza",
                    r"almacenamiento",
                    r"condiciones\s+de\s+operación"
                ]
            },

            "NMX-I-60950-1-NYCE-2015": {

                "Instrucciones de instalación segura": [
                    r"conexión\s+a\s+tierra",
                    r"puesta\s+a\s+tierra",
                    r"ventilación\s+adecuada",
                    r"no\s+bloquear\s+rejillas",
                    r"instalación\s+segura"
                ],

                "Mantenimiento y operación segura": [
                    r"desconectar\s+antes\s+de\s+limpiar",
                    r"no\s+utilizar\s+en\s+exteriores",
                    r"evitar\s+humedad",
                    r"revisión\s+por\s+técnico\s+autorizado"
                ]
            }
        },
        "NOM-024-SCFI-2013": {
    "Información al consumidor": [
        r"fabricante|importador",
        r"raz[oó]n social",
        r"domicilio",
        r"manual de usuario",
        r"condiciones de uso",
        r"garant[ií]a"
    ]
},

        
        "Etiqueta": {
            
    "NMX-I-60950-1-NYCE-2015": {
        "Seguridad eléctrica": [
            r"s[ií]mbolo\s+de\s+doble\s+aislamiento",
            r"clase\s+i",
            r"riesgo\s+el[eé]ctrico",
            r"s[ií]mbolo\s+de\s+tierra",
            r"ce\b",
            r"ul\b",
            r"nom-nyce\b"
        ]
    },

    "NOM-008-SCFI-2002": {
        "Etiquetado comercial": [
            r"marca",
            r"modelo",
            r"fabricante",
            r"pa[ií]s\s+de\s+origen"
        ]
    },

    "NOM-106-SCFI-2000": {
    "Contraseña oficial NOM": [
        r"logotipo nom",
        r"sello nom",
        r"contrase[ñn]a oficial"
    ]
},

    "NOM-024-SCFI-2013": {
        "Reciclado RAEE": [
            r"s[ií]mbolo\s+de\s+reciclado",
            r"residuos\s+el[eé]ctricos",
            r"basurero\s+tachado"
        ]
    }
}

    },

"SmartTV": {

    "Ficha": {
        "NOM-001-SCFI-2018": {

            "Seguridad eléctrica": [
                r"100\s*[-–]?\s*240\s*v(ac)?",
                r"50\s*/\s*60\s*hz",
                r"voltaje\s+de\s+entrada",
                r"corriente\s+nominal",
                r"potencia\s*(nominal|máxima)?\s*\d+(\.\d+)?\s*w",
                r"consumo\s+de\s+energía",
                r"condiciones?\s+de\s+operación"
            ]
        },

        "NMX-I-60065-NYCE-2015": {

            "Seguridad térmica y ventilación": [
                r"temperatura\s+de\s+(operación|trabajo|almacenamiento)",
                r"\d+\s*[°º]?\s*c\s*[-–~]\s*\d+\s*[°º]?\s*c",
                r"humedad\s*\d+%\s*[-–~]\s*\d+%",
                r"ventilación",
                r"disipación\s+térmica"
            ]
        },

        "NMX-I-60950-1-NYCE-2015": {

            "Conexión de periféricos": [
                r"hdmi\s*\d+(\.\d+)?",
                r"usb\s*\d+(\.\d+)?",
                r"rj[- ]?45",
                r"entrada\s+av",
                r"salida\s+(óptica|optica|spdif)",
                r"audio\s+digital",
                r"resolución\s*(uhd|4k|3840\s*x\s*2160)"
            ],

            "Compatibilidad electromagnética": [
                r"interferencia\s+electromagnética",
                r"emisión\s+radiada",
                r"compatibilidad\s+electromagnética",
                r"filtro\s+emi"
            ]
        },

        "NOM-032-ENER-2013": {

            "Eficiencia energética": [
                r"modo\s+espera",
                r"stand[- ]?by",
                r"consumo\s+en\s+espera",
                r"ahorro\s+de\s+energía",
                r"eficiencia\s+energética"
            ]
        },

        "NOM-192-SCFI/SCT1-2013": {

            "Conectividad inalámbrica": [
                r"wi[- ]?fi",
                r"ieee\s*802\.11",
                r"bluetooth",
                r"2\.4\s*ghz",
                r"5\s*ghz"
            ],

            "Advertencias RF": [
                r"interferencia\s+de\s+radio",
                r"potencia\s+de\s+transmisión",
                r"cumple\s+con\s+ift"
            ]
        },

        "NMX-J-640-ANCE-2010": {

            "Identificación del producto": [
                r"modelo",
                r"número\s+de\s+serie",
                r"etiqueta",
                r"información\s+técnica",
                r"fabricante"
            ],

            "Durabilidad del marcaje": [
                r"marcado\s+permanente",
                r"etiqueta\s+durable",
                r"marcado\s+indeleble"
            ]
        }
    },

    "Manual": {
        "NOM-001-SCFI-2018": {

            "Advertencias de seguridad eléctrica": [
                r"riesgo\s+de\s+(descarga|choque)\s+eléctrica",
                r"no\s+abrir",
                r"no\s+desensamblar",
                r"desconecte\s+antes\s+de\s+limpiar",
                r"no\s+modifique\s+el\s+cable"
            ],

            "Uso seguro del equipo": [
                r"no\s+exponer\s+al\s+agua",
                r"mantener\s+alejado\s+de\s+humedad",
                r"no\s+colocar\s+objetos\s+encima",
                r"mantener\s+fuera\s+del\s+alcance\s+de\s+niños"
            ]
        },

        "NMX-I-60065-NYCE-2015": {

            "Ventilación y temperatura": [
                r"no\s+cubrir\s+las\s+ranuras",
                r"mantener\s+ventilación\s+adecuada",
                r"riesgo\s+de\s+sobrecalentamiento",
                r"superficie\s+caliente"
            ],

            "Mantenimiento preventivo": [
                r"limpie\s+con\s+paño\s+suave",
                r"no\s+use\s+solventes",
                r"desconecte\s+antes\s+de\s+limpiar"
            ]
        },

        "NMX-I-60950-1-NYCE-2015": {

            "Conexión de periféricos": [
                r"puerto\s+hdmi",
                r"puerto\s+usb",
                r"entrada\s+av",
                r"salida\s+óptica",
                r"conexión\s+ethernet"
            ],

            "Protección de interfaces": [
                r"descargas\s+electrostáticas",
                r"no\s+forzar\s+el\s+conector",
                r"manejo\s+adecuado\s+de\s+conectores"
            ]
        },

        "NOM-032-ENER-2013": {

            "Uso eficiente de energía": [
                r"modo\s+eco",
                r"ahorro\s+de\s+energía",
                r"apagado\s+automático",
                r"consumo\s+reducido"
            ]
        },

        "NOM-192-SCFI/SCT1-2013": {

            "Configuración inalámbrica": [
                r"configuración\s+de\s+red",
                r"conexión\s+inalámbrica",
                r"wifi",
                r"bluetooth"
            ],

            "Advertencias RF": [
                r"no\s+cubrir\s+las\s+antenas",
                r"mantener\s+distancia",
                r"interferencia\s+electromagnética"
            ]
        }
    },
    "Etiqueta": {

    "NOM-106-SCFI-2000": {
        "Contraseña oficial": [
            r"\bnom\b",
            r"contrase[nñ]a\s+oficial"
        ]
    },

    "NMX-I-60950-1-NYCE-2015": {
        "Seguridad eléctrica": [
            r"doble\s+aislamiento",
            r"clase\s+i",
            r"riesgo\s+el[eé]ctrico",
            r"ce\b",
            r"ul\b"
        ]
    },

    "NMX-I-60065-NYCE-2015": {
        "Advertencias eléctricas": [
            r"s[ií]mbolo\s+de\s+peligro",
            r"superficie\s+caliente",
            r"advertencia"
        ]
    },

    "NOM-208-SCFI-2016": {
        "Telecomunicaciones": [
            r"nyce\b",
            r"ift\b",
            r"identificaci[oó]n\s+de\s+la\s+norma"
        ]
    },

    "NOM-024-SCFI-2013": {
        "Reciclado": [
            r"reciclado",
            r"raee",
            r"basurero\s+tachado"
        ]
    }
}

},

   "Luminaria": {
    "Ficha": {

        "NMX-J-038/1-ANCE-2005": {

            "Seguridad eléctrica": [
                r"seguridad\s+eléctrica",
                r"corriente\s+de\s+fuga",
                r"resistencia\s+dieléctrica",
                r"prueba\s+dieléctrica",
                r"ensayos?\s+eléctricos?",
                r"pruebas?\s+de\s+seguridad"
            ],

            "Condiciones de operación eléctrica": [
                r"tensión\s+nominal",
                r"rango\s+de\s+voltaje",
                r"variación\s+de\s+(tensión|voltaje)",
                r"protección\s+térmica",
                r"temperatura\s+de\s+operación"
            ]
        },

        "NOM-031-ENER-2019": {

            "Eficacia luminosa": [
                r"eficacia\s+luminosa",
                r"lm\s*/\s*w",
                r"lúmenes\s+por\s+vatio",
                r"rendimiento\s+luminoso",
                r"eficiencia\s+lumínica"
            ],

            "Factor de potencia": [
                r"factor\s+de\s+potencia",
                r"\bfp\b",
                r"power\s+factor",
                r"distorsión\s+armónica"
            ],

            "Flujo luminoso": [
                r"flujo\s+luminoso",
                r"lúmenes",
                r"distribución\s+luminosa",
                r"curva\s+fotométrica",
                r"iesna"
            ],

            "Curvas fotométricas": [
                r"\.ies\b",
                r"\.ldt\b",
                r"archivo\s+fotométrico",
                r"intensidad\s+lumínica",
                r"cd\s*/\s*100\s*lm"
            ],

            "Temperatura de color y CRI": [
                r"temperatura\s+de\s+color",
                r"\bCCT\b",
                r"\bCRI\b",
                r"índice\s+de\s+reproducción\s+cromática",
                r"\b\d{4}\s*k\b"
            ]
        },

        "NMX-J-507/2-ANCE-2013": {

            "Parámetros eléctricos": [
                r"voltaje",
                r"corriente",
                r"frecuencia\s+50\s*/\s*60\s*hz",
                r"consumo\s+eléctrico",
                r"potencia\s+nominal"
            ],

            "Ciclos de encendido": [
                r"ciclos?\s+de\s+encendido",
                r"on\s*/\s*off",
                r"vida\s+útil\s+de\s+encendido"
            ]
        },

        "NMX-J-543-ANCE-2013": {

            "Ensayos eléctricos": [
                r"corriente\s+de\s+fuga",
                r"resistencia\s+dieléctrica",
                r"prueba\s+de\s+aislamiento",
                r"ensayo\s+eléctrico",
                r"laboratorio\s+acreditado"
            ],

            "Resistencia mecánica": [
                r"impacto\s+mecánico",
                r"\bik\d{2}\b",
                r"resistencia\s+mecánica",
                r"vibración"
            ]
        },

        "NMX-J-610/4-5-ANCE-2013": {

            "Aislamiento y envejecimiento": [
                r"aislamiento\s+eléctrico",
                r"aislamiento\s+térmico",
                r"envejecimiento",
                r"life\s+test",
                r"lm-80",
                r"tm-21"
            ],

            "Seguridad fotobiológica": [
                r"fotobiológica",
                r"iec\s*62471",
                r"\brg[01]\b",
                r"riesgo\s+ocular"
            ],

            "Grado de protección": [
                r"\bip\d{2}\b",
                r"grado\s+de\s+protección",
                r"hermeticidad",
                r"resistencia\s+al\s+agua",
                r"resistencia\s+al\s+polvo"
            ]
        },

        "NOM-030-ENER-2016": {

            "Eficiencia energética": [
                r"eficiencia\s+energética",
                r"pérdidas\s+totales",
                r"potencia\s+nominal",
                r"consumo\s+eléctrico"
            ]
        },

        "NOM-024-ENER-2016": {

            "Control y compatibilidad": [
                r"dimmer",
                r"control\s+inteligente",
                r"1\s*-\s*10\s*v",
                r"dali",
                r"zigbee",
                r"fotocélula",
                r"control\s+inalámbrico"
            ]
        }
    },

    "Manual": {

        "NMX-J-507/2-ANCE-2013": {

            "Instalación y montaje": [
                r"instalación",
                r"montaje",
                r"altura\s+de\s+montaje",
                r"orientación",
                r"soporte\s+mecánico"
            ],

            "Advertencias y mantenimiento": [
                r"desconectar\s+antes\s+de\s+abrir",
                r"riesgo\s+eléctrico",
                r"superficie\s+caliente",
                r"mantenimiento\s+preventivo",
                r"limpieza"
            ]
        },

        "NMX-J-543-ANCE-2013": {

            "Conexiones eléctricas": [
                r"terminal\s+eléctrica",
                r"conector",
                r"puesta\s+a\s+tierra",
                r"corriente\s+máxima",
                r"tensión\s+nominal"
            ],

            "Seguridad eléctrica": [
                r"riesgo\s+de\s+descarga\s+eléctrica",
                r"aislamiento\s+reforzado",
                r"sobre\s*corriente",
                r"advertencia\s+eléctrica"
            ]
        },

        "NMX-J-610/4-5-ANCE-2013": {

            "Compatibilidad electromagnética": [
                r"compatibilidad\s+electromagnética",
                r"\bEMC\b",
                r"\bEMI\b",
                r"armónicos",
                r"sobre\s*tensiones"
            ],

            "Alimentación eléctrica": [
                r"voltaje\s+de\s+entrada",
                r"frecuencia\s+50\s*/\s*60\s*hz",
                r"puesta\s+a\s+tierra",
                r"protección\s+contra\s+sobre\s*corriente"
            ]
        },

        "NOM-030-ENER-2016": {

            "Información energética": [
                r"eficacia\s+luminosa",
                r"lm\s*/\s*w",
                r"vida\s+útil",
                r"l70",
                r"cct",
                r"cri"
            ],

            "Marcado del producto": [
                r"marca",
                r"modelo",
                r"potencia\s+nominal",
                r"flujo\s+luminoso",
                r"etiqueta\s+energética"
            ]
        },

        "NOM-024-ENER-2016": {

            "Instalación eficiente": [
                r"sensor\s+de\s+movimiento",
                r"fotocélula",
                r"control\s+de\s+atenuación",
                r"instalación\s+por\s+personal\s+calificado"
            ],

            "Advertencias de uso": [
                r"no\s+exponer\s+a\s+humedad",
                r"riesgo\s+de\s+incendio",
                r"no\s+cubrir\s+el\s+luminario",
                r"advertencia"
            ]
        }
    },
    "Etiqueta": {

    "NOM-106-SCFI-2000": {
        "Contraseña oficial": [
            r"\bnom\b",
            r"contrase[nñ]a\s+oficial"
        ]
    },

    "NOM-031-ENER-2019": {
        "Flujo luminoso": [
            r"\d+\s*lm",
            r"flujo\s+luminoso"
        ],
        "Potencia nominal": [
            r"\d+\s*w",
            r"potencia\s+nominal"
        ]
    },

    "NMX-J-507/2-ANCE-2013": {
        "Voltaje nominal": [
            r"\d+\s*v",
            r"voltaje\s+nominal"
        ]
    },

    "NMX-J-543-ANCE-2013": {
        "Datos grabados": [
            r"corriente\s+nominal",
            r"tipo\s+de\s+l[aá]mpara"
        ]
    },

    "NOM-030-ENER-2016": {
        "Logotipo de certificación": [
            r"ANCE\b",
            r"logotipo"
        ]
    }
}

}
}
