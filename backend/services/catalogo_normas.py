# backend/services/catalogo_normas.py

CATALOGO_NORMAS = {

    # ==========================================================
    # LAPTOP
    # ==========================================================
   "Laptop": {

    "NOM-001-SCFI-2018": {
        "nombre": "Seguridad eléctrica",
        "descripcion": "Seguridad eléctrica del equipo.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "evidencia_esperada": [
            "Voltaje y frecuencia",
            "Advertencias eléctricas"
        ]
    },

    "NOM-008-SCFI-2002": {
        "nombre": "Sistema General de Unidades de Medida",
        "descripcion": "Uso correcto de unidades SI.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "evidencia_esperada": [
            "Unidades SI (V, W, Hz)"
        ]
    },

    "NOM-019-SE-2021": {
        "nombre": "Marcado y advertencias de seguridad",
        "descripcion": "Advertencias y símbolos visibles.",
        "documentos_aplicables": ["Manual", "Etiqueta"],
        "evidencia_esperada": [
            "Advertencias de riesgo",
            "Símbolos de seguridad"
        ]
    },

    "NOM-024-SCFI-2013": {
        "nombre": "Reciclado RAEE",
        "descripcion": "Símbolo de reciclaje.",
        "documentos_aplicables": ["Etiqueta"],
        "evidencia_esperada": [
            "Símbolo RAEE"
        ]
    },

    "NMX-I-60950-1-NYCE-2015": {
        "nombre": "Seguridad eléctrica (marcado)",
        "descripcion": "Certificaciones y símbolos eléctricos.",
        "documentos_aplicables": ["Etiqueta", "Ficha", "Manual"],
        "evidencia_esperada": [
            "Logos NYCE / CE / UL",
            "Doble aislamiento",
            "Advertencia eléctrica"
        ]
    },

    "NOM-106-SCFI-2000": {
        "nombre": "Contraseña oficial NOM",
        "descripcion": "Logotipo NOM visible.",
        "documentos_aplicables": ["Etiqueta"],
        "evidencia_esperada": [
            "Logotipo NOM"
        ]
    }
},

    # ==========================================================
    # SMART TV
    # ==========================================================
    "SmartTV": {

        "NOM-001-SCFI-2018": {
            "nombre": "Seguridad eléctrica",
            "descripcion": (
                "Evalúa que el televisor opere bajo condiciones eléctricas seguras, "
                "minimizando riesgos de descarga eléctrica y fallas por conexión incorrecta."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Voltaje y consumo eléctrico",
                "Advertencias de seguridad eléctrica",
                "Instrucciones de conexión"
            ]
        },

        "NOM-032-ENER-2013": {
            "nombre": "Eficiencia energética",
            "descripcion": (
                "Evalúa el consumo energético del equipo durante su operación normal y en "
                "modo de espera, promoviendo el uso eficiente de la energía eléctrica."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Consumo en watts",
                "Modo standby",
                "Funciones de ahorro de energía"
            ]
        },

        "NOM-192-SCFI/SCT1-2013": {
            "nombre": "Equipos con conectividad inalámbrica",
            "descripcion": (
                "Evalúa que los equipos con conectividad inalámbrica operen dentro de los "
                "parámetros permitidos, evitando interferencias y asegurando el cumplimiento "
                "con la regulación del espectro radioeléctrico."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Declaración de WiFi o Bluetooth",
                "Advertencias sobre interferencia",
                "Cumplimiento con IFT"
            ]
        },

        "NMX-I-60065-NYCE-2015": {
            "nombre": "Seguridad en equipos audiovisuales",
            "descripcion": (
                "Evalúa la seguridad térmica y mecánica de los equipos audiovisuales, así "
                "como las condiciones de ventilación y uso seguro del producto."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Instrucciones de ventilación",
                "Advertencias de sobrecalentamiento",
                "Condiciones de operación"
            ]
        },
    # ================= EXISTENTE =================

      

            "NOM-106-SCFI-2000": {
                "nombre": "Contraseña oficial NOM",
                "descripcion": "Presencia del distintivo NOM en la etiqueta.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": ["Logotipo NOM"]
            },

            "NMX-I-60950-1-NYCE-2015": {
                "nombre": "Seguridad eléctrica",
                "descripcion": "Símbolos eléctricos y certificaciones.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": [
                    "Doble aislamiento",
                    "Símbolo de riesgo eléctrico",
                    "Logos CE / UL"
                ]
            },

            "NOM-024-SCFI-2013": {
                "nombre": "Reciclado",
                "descripcion": "Símbolo RAEE en el etiquetado.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": ["Símbolo de reciclaje"]
            
        }
    },

    # ==========================================================
    # LUMINARIA
    # ==========================================================
    "Luminaria": {

        "NOM-031-ENER-2019": {
            "nombre": "Eficiencia energética de luminarios LED",
            "descripcion": (
                "Evalúa el desempeño energético de luminarios LED, incluyendo la eficacia "
                "luminosa, el factor de potencia y el flujo luminoso."
            ),
            "documentos_aplicables": ["Ficha"],
            "evidencia_esperada": [
                "Eficacia luminosa (lm/W)",
                "Factor de potencia",
                "Flujo luminoso",
                "Curvas fotométricas"
            ]
        },

        "NOM-030-ENER-2016": {
            "nombre": "Eficiencia energética",
            "descripcion": (
                "Evalúa el consumo eléctrico del luminario y sus pérdidas energéticas, "
                "promoviendo el uso eficiente de la energía."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Potencia nominal",
                "Consumo energético",
                "Datos de eficiencia"
            ]
        },

        "NMX-J-507/2-ANCE-2013": {
            "nombre": "Desempeño fotométrico",
            "descripcion": (
                "Evalúa la distribución luminosa y el flujo luminoso del luminario, así como "
                "los métodos de prueba utilizados para su medición."
            ),
            "documentos_aplicables": ["Ficha", "Manual"],
            "evidencia_esperada": [
                "Curvas fotométricas (IES/LDT)",
                "Flujo luminoso",
                "Información LM-79"
            ]
        },

            

            "NOM-106-SCFI-2000": {
                "nombre": "Contraseña oficial NOM",
                "descripcion": "Distintivo NOM visible en el producto.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": ["Logotipo NOM"]
            },

            "NOM-031-ENER-2019": {
                "nombre": "Flujo luminoso y potencia",
                "descripcion": "Valores visibles en etiqueta.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": [
                    "Flujo luminoso (lm)",
                    "Potencia nominal (W)"
                ]
            },

            "NMX-J-507/2-ANCE-2013": {
                "nombre": "Voltaje nominal",
                "descripcion": "Información eléctrica visible.",
                "documentos_aplicables": ["Etiqueta"],
                "fuente": "visual",
                "evidencia_esperada": ["Voltaje nominal"]
            }
        
    }
}
