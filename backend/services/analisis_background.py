from backend.database import SessionLocal
from backend import models
from backend.services import ia_analisis
from backend.services.resultado_normativo import construir_resultado_normativo
from datetime import datetime
import traceback

def analizar_documento_background(id_documento: int):
    db = SessionLocal()

    try:
        documento = db.query(models.Documento).filter(
            models.Documento.id_documento == id_documento
        ).first()

        if not documento:
            return

        documento.estado = "procesando"
        db.commit()

        producto = db.query(models.Producto).filter(
            models.Producto.id_producto == documento.id_producto
        ).first()

        # ---- Normalización (MISMA lógica que ya usabas)
        categoria_clean = "Laptop"
        if producto:
            cat_map = {
                "laptop": "Laptop",
                "smarttv": "SmartTV",
                "smart tv": "SmartTV",
                "tv": "SmartTV",
                "luminaria": "Luminaria"
            }
            categoria_clean = cat_map.get(producto.nombre.lower(), "Laptop")

        nombre_doc = documento.nombre.lower()
        tipo_clean = "Ficha"
        if "manual" in nombre_doc:
            tipo_clean = "Manual"
        elif "etiqueta" in nombre_doc:
            tipo_clean = "Etiqueta"

        # 🔥 ANÁLISIS PESADO (AQUÍ YA NO BLOQUEA HTTP)
        resultados_ia = ia_analisis.analizar_documento(
            documento.archivo_url,
            tipo_clean,
            categoria_clean
        )

        resultado_normativo = construir_resultado_normativo(
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            resultados_ia=resultados_ia
        )

        documento.analisis_ia = resultados_ia
        documento.estado = "finalizado"
        documento.error_proceso = None
        db.commit()

        # Actualizar fecha producto (lo que ya hacías)
        if producto:
            producto.fecha_registro = datetime.utcnow()
            db.commit()

    except Exception as e:
        print("❌ Error en análisis background:", e)
        traceback.print_exc()
        documento.estado = "error"
        documento.error_proceso = str(e)
        db.commit()

    finally:
        db.close()
