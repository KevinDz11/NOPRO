# backend/services/recomendacion_laboratorios.py

from backend.services.laboratorios_catalogo import LABORATORIOS_BASE


def recomendar_laboratorios(producto: str, normas_detectadas: list):
    recomendaciones = []

    for lab in LABORATORIOS_BASE:
        score = 0

        # Coincidencia por producto
        if producto in lab["categorias"]:
            score += 3

        # Coincidencia por normas técnicas
        score += len(
            set(normas_detectadas) & set(lab["noms_tecnicas"])
        ) * 2

        recomendaciones.append({
            "nombre": lab["nombre"],
            "abreviatura": lab["abreviatura"],
            "direccion": lab["direccion"],
            "telefono": lab["telefono"],
            "tipo_ensayo": lab["tipo_ensayo"],
            "tipo_servicio": lab["tipo_servicio"],
            "score": score,
            "motivo": generar_motivo(lab, producto, normas_detectadas)
        })

    return sorted(recomendaciones, key=lambda x: x["score"], reverse=True)


def generar_motivo(lab, producto, normas):
    motivos = []

    if producto in lab["categorias"]:
        motivos.append(f"experiencia en {producto}")

    normas_comunes = set(normas) & set(lab["noms_tecnicas"])
    if normas_comunes:
        motivos.append(
            f"acreditación en {', '.join(normas_comunes)}"
        )

    return (
        "Cuenta con " + " y ".join(motivos)
        if motivos
        else "Laboratorio disponible para pruebas técnicas"
    )
