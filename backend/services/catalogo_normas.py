# backend/services/catalogo_normas.py

CATALOGO_NORMAS = {

    # ==========================================================
    # LAPTOP
    # ==========================================================
  "Laptop": {

    "NOM-001-SCFI-2018": {
        "nombre": "Seguridad eléctrica",
        "descripcion": "Requisitos de seguridad eléctrica del equipo.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Voltaje y frecuencia",
            "Advertencias eléctricas"
        ]
    },

    "NOM-008-SCFI-2002": {
        "nombre": "Sistema General de Unidades de Medida",
        "descripcion": "Uso correcto de unidades del SI.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Unidades SI (V, W, Hz)"
        ]
    },

    "NOM-019-SE-2021": {
        "nombre": "Marcado y advertencias de seguridad",
        "descripcion": "Advertencias y símbolos de seguridad del equipo.",
        "documentos_aplicables": ["Manual", "Etiqueta"],
        "fuente": "mixta",
        "evidencia_esperada": [
            "Advertencias de riesgo",
            "Símbolos de seguridad"
        ]
    },

    "NOM-024-SCFI-2013": {
        "nombre": "Reciclado RAEE",
        "descripcion": "Símbolo de reciclaje del producto.",
        "documentos_aplicables": ["Etiqueta"],
        "fuente": "visual",
        "evidencia_esperada": [
            "Símbolo RAEE"
        ]
    },

    "NMX-I-60950-1-NYCE-2015": {
        "nombre": "Seguridad eléctrica y marcado",
        "descripcion": "Certificaciones y advertencias eléctricas del equipo.",
        "documentos_aplicables": ["Etiqueta", "Ficha", "Manual"],
        "fuente": "mixta",
        "evidencia_esperada": [
            "Logos NYCE / CE / UL",
            "Advertencia eléctrica",
            "Doble aislamiento"
        ]
    },
    
    "NOM-024-SCFI-2013": {
    "nombre": "Información comercial para equipos electrónicos",
    "descripcion": "Requisitos de información comercial y técnica para equipos electrónicos.",
    "documentos_aplicables": ["Ficha", "Manual"],
    "fuente": "textual",
    "evidencia_esperada": [
        "Modelo del producto",
        "Nombre del fabricante o importador",
        "País de origen",
        "Manual de usuario",
        "Datos técnicos del equipo"
    ]
},


    "NOM-106-SCFI-2000": {
        "nombre": "Contraseña oficial NOM",
        "descripcion": "Uso del logotipo NOM en el etiquetado.",
        "documentos_aplicables": ["Etiqueta"],
        "fuente": "visual",
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
        "descripcion": "Requisitos de seguridad eléctrica del televisor.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Voltaje de operación",
            "Frecuencia",
            "Advertencias eléctricas"
        ]
    },

    "NOM-032-ENER-2013": {
        "nombre": "Eficiencia energética",
        "descripcion": "Consumo energético y modos de ahorro del televisor.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Modo standby",
            "Consumo energético",
            "Modo ahorro de energía"
        ]
    },

    "NOM-192-SCFI/SCT1-2013": {
        "nombre": "Conectividad inalámbrica",
        "descripcion": "Requisitos para equipos con WiFi y Bluetooth.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "WiFi",
            "Bluetooth",
            "Cumple con IFT"
        ]
    },

    "NMX-I-60065-NYCE-2015": {
        "nombre": "Seguridad térmica y ventilación",
        "descripcion": "Requisitos de temperatura, ventilación y operación segura.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Temperatura de operación",
            "Ventilación adecuada",
            "Advertencias térmicas"
        ]
    },

    "NMX-I-60950-1-NYCE-2015": {
        "nombre": "Seguridad eléctrica e interfaces",
        "descripcion": "Seguridad en puertos, periféricos y conexiones.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Puertos HDMI / USB",
            "Protección ESD",
            "Advertencias de conexión"
        ]
    },

    "NMX-J-606-ANCE-2008": {
        "nombre": "Componentes y fusibles",
        "descripcion": "Protección interna, fusibles y componentes eléctricos.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Fusible de protección",
            "Protección térmica",
            "Circuito interno"
        ]
    },

    "NMX-J-551-ANCE-2012": {
        "nombre": "Cableado y alimentación",
        "descripcion": "Requisitos del cable de poder y alimentación.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Cable de alimentación",
            "Voltaje adecuado",
            "Recomendaciones de seguridad"
        ]
    },

    "NMX-J-640-ANCE-2010": {
        "nombre": "Identificación y etiquetado",
        "descripcion": "Datos del producto, modelo y marcaje permanente.",
        "documentos_aplicables": ["Etiqueta"],
        "fuente": "visual",
        "evidencia_esperada": [
            "Modelo",
            "Número de serie",
            "Etiqueta legible"
        ]
    },

    "NOM-106-SCFI-2000": {
        "nombre": "Contraseña oficial NOM",
        "descripcion": "Uso del logotipo NOM en el etiquetado.",
        "documentos_aplicables": ["Etiqueta"],
        "fuente": "visual",
        "evidencia_esperada": [
            "Logotipo NOM"
        ]
    }
},

    # ==========================================================
    # LUMINARIA
    # ==========================================================
   "Luminaria": {

    "NMX-J-038/1-ANCE-2005": {
        "nombre": "Seguridad eléctrica y desempeño",
        "descripcion": "Requisitos de seguridad eléctrica para luminarios.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Pruebas eléctricas",
            "Condiciones de tensión",
            "Protección térmica"
        ]
    },

    "NOM-031-ENER-2019": {
        "nombre": "Eficiencia energética de luminarios",
        "descripcion": "Eficacia luminosa y desempeño energético.",
        "documentos_aplicables": ["Ficha"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Eficacia luminosa (lm/W)",
            "Factor de potencia",
            "Flujo luminoso"
        ]
    },

    "NMX-J-507/2-ANCE-2013": {
        "nombre": "Parámetros eléctricos y ciclos",
        "descripcion": "Condiciones eléctricas y ciclos de encendido.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Voltaje",
            "Corriente",
            "Ciclos de encendido"
        ]
    },

    "NMX-J-543-ANCE-2013": {
        "nombre": "Ensayos eléctricos y compatibilidad",
        "descripcion": "Ensayos de aislamiento y resistencia.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Prueba dieléctrica",
            "Corriente de fuga",
            "Compatibilidad"
        ]
    },

    "NMX-J-610/4-5-ANCE-2013": {
        "nombre": "Aislamiento, IP y seguridad fotobiológica",
        "descripcion": "Protección eléctrica, térmica y fotobiológica.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "mixta",
        "evidencia_esperada": [
            "Aislamiento eléctrico",
            "Grado de protección IP",
            "Evaluación fotobiológica"
        ]
    },

    "NOM-030-ENER-2016": {
        "nombre": "Eficiencia energética LED",
        "descripcion": "Eficiencia y desempeño energético.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Eficiencia energética",
            "Consumo eléctrico"
        ]
    },

    "NOM-024-ENER-2016": {
        "nombre": "Control y compatibilidad inteligente",
        "descripcion": "Sistemas de control, sensores y atenuación.",
        "documentos_aplicables": ["Ficha", "Manual"],
        "fuente": "textual",
        "evidencia_esperada": [
            "Dimming",
            "Control inteligente",
            "Sensores"
        ]
    },

    "NOM-106-SCFI-2000": {
        "nombre": "Contraseña oficial NOM",
        "descripcion": "Uso del logotipo NOM en el etiquetado.",
        "documentos_aplicables": ["Etiqueta"],
        "fuente": "visual",
        "evidencia_esperada": [
            "Logotipo NOM"
        ]
    }
}


}
