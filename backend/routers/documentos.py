import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from pydantic import BaseModel
from typing import List
from backend.services.resultado_normativo import construir_resultado_normativo

from .. import crud, schemas, database, auth, models

# Servicios existentes
from ..services import ia_analisis, pdf_report

# 🆕 SERVICIO NORMATIVO
from ..services.resultado_normativo import construir_resultado_normativo

router = APIRouter(prefix="/documentos", tags=["Documentos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ============================================================
# SCHEMA PARA REPORTE GENERAL
# ============================================================
class ReporteGeneralRequest(BaseModel):
    ids_documentos: List[int]

# ============================================================
# SUBIR Y ANALIZAR DOCUMENTO
# ============================================================
@router.post("/subir-analizar", response_model=schemas.DocumentoAnalisisOut)
def subir_y_analizar(
    id_producto: int = Form(...),
    nombre: str = Form(...),
    tipo: str = Form(...),
    categoria: str = Form(...),
    marca: str = Form(""),
    archivo: UploadFile = File(...),
    analizar: bool = Form(True),
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    try:
        # ----------------------------------------------------
        # Guardar archivo
        # ----------------------------------------------------
        id_cliente = current_user.id_cliente
        file_path = os.path.join(UPLOAD_DIR, archivo.filename)

        with open(file_path, "wb") as f:
            f.write(archivo.file.read())

        documento_data = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )

        doc_db = crud.create_documento(
            db,
            documento_data,
            archivo_url=file_path
        )

        # 🔴 SIEMPRE inicializar
        resultados_ia = []
        resultado_normativo = []

        # ----------------------------------------------------
        # ANALISIS IA
        # ----------------------------------------------------
        if analizar and archivo.filename.lower().endswith(".pdf"):

            cat_map = {
                "laptop": "Laptop",
                "smarttv": "SmartTV",
                "smart tv": "SmartTV",
                "tv": "SmartTV",
                "luminaria": "Luminaria"
            }
            categoria_clean = cat_map.get(categoria.lower(), "Laptop")

            tipo_clean = "Ficha"
            if "manual" in tipo.lower():
                tipo_clean = "Manual"
            elif "etiqueta" in tipo.lower():
                tipo_clean = "Etiqueta"

            print(f"📄 Analizando: {categoria_clean} - {tipo_clean}")

            resultados_ia = ia_analisis.analizar_documento(
                file_path,
                tipo_clean,
                categoria_clean,
                marca_esperada=marca
            )

            resultado_normativo = construir_resultado_normativo(
                categoria_producto=categoria_clean,
                tipo_documento=tipo_clean,
                resultados_ia=resultados_ia
            )

            if resultados_ia:
                crud.update_documento_analisis(
                    db,
                    doc_db.id_documento,
                    resultados_ia
                )

        # 🔴 ESTO ES CLAVE: SIEMPRE ASIGNAR
        doc_db.analisis_ia = resultados_ia
        doc_db.resultado_normativo = resultado_normativo

        return doc_db

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error: {str(e)}"
        )

# ============================================================
# LISTAR DOCUMENTOS
# ============================================================
@router.get("/", response_model=list[schemas.DocumentoAnalisisOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)


# ============================================================
# REPORTE PDF GENERAL (VARIOS DOCUMENTOS)
# ============================================================
@router.post("/reporte-general-pdf")
def generar_reporte_general_pdf(
    data: ReporteGeneralRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    ids_documentos = data.ids_documentos

    try:
        # 1️⃣ Obtener documentos del usuario
        documentos = db.query(models.Documento).filter(
            models.Documento.id_documento.in_(data.ids_documentos),
            models.Documento.id_cliente == current_user.id_cliente
        ).all()

        if not documentos:
            raise HTTPException(
                status_code=404,
                detail="No se encontraron documentos válidos"
            )

        # 2️⃣ Construir estructura para el PDF
        bloques_documentos = []

        for doc in documentos:
            producto = db.query(models.Producto).filter(
                models.Producto.id_producto == doc.id_producto
            ).first()

            categoria_prod = producto.nombre if producto else "Laptop"
            marca_prod = producto.marca if producto and producto.marca else "Genérico"
            modelo_prod = producto.descripcion if producto else "Sin modelo"

            cat_map = {
                "laptop": "Laptop",
                "smarttv": "SmartTV",
                "smart tv": "SmartTV",
                "tv": "SmartTV",
                "luminaria": "Luminaria"
            }
            categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

            nombre_doc = doc.nombre.lower()
            tipo_clean = "Ficha"
            if "manual" in nombre_doc:
                tipo_clean = "Manual"
            elif "etiqueta" in nombre_doc:
                tipo_clean = "Etiqueta"

            resultado_normativo = construir_resultado_normativo(
                categoria_producto=categoria_clean,
                tipo_documento=tipo_clean,
                resultados_ia=doc.analisis_ia or []
            )

            bloques_documentos.append({
                "documento": doc,
                "resultados_ia": doc.analisis_ia or [],
                "resultado_normativo": resultado_normativo,
                "categoria": categoria_clean,
                "tipo": tipo_clean,
                "marca": marca_prod,
                "modelo": modelo_prod
            })

       # 3️⃣ Generar PDF GENERAL
        pdf_buffer = pdf_report.generar_pdf_reporte_general(
             lista_docs=bloques_documentos,  # ✅ CORRECTO
            categoria_producto="Multi-producto",
            marca_producto="Varias marcas",
    modelo_producto="Varios modelos"
)


        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=Reporte_General.pdf"
            }
        )

    except Exception as e:
        print(f"❌ Error PDF general: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error generando el reporte general"
        )

# ============================================================
# REPORTE PDF INDIVIDUAL
# ============================================================
@router.get("/{id_documento}/reporte-pdf")
def descargar_reporte_pdf(
    id_documento: int,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    db_doc = db.query(models.Documento).filter(
        models.Documento.id_documento == id_documento
    ).first()

    if not db_doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    if db_doc.id_cliente != current_user.id_cliente:
        raise HTTPException(status_code=403, detail="No autorizado")

    if not db_doc.analisis_ia:
        raise HTTPException(
            status_code=400,
            detail="Este documento no ha sido analizado aún."
        )

    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == db_doc.id_producto
    ).first()

    categoria_prod = producto.nombre if producto else "Laptop"
    marca_prod = producto.marca if producto and producto.marca else "Genérico"
    modelo_prod = producto.descripcion if producto and producto.descripcion else "Sin Modelo"

    cat_map = {
        "laptop": "Laptop",
        "smarttv": "SmartTV",
        "smart tv": "SmartTV",
        "tv": "SmartTV",
        "luminaria": "Luminaria"
    }
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    nombre_doc = db_doc.nombre.lower()
    tipo_clean = "Ficha"
    if "manual" in nombre_doc:
        tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc:
        tipo_clean = "Etiqueta"

    try:
        # 🔥 CONSTRUIR RESULTADO NORMATIVO
        resultado_normativo = construir_resultado_normativo(
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            resultados_ia=db_doc.analisis_ia
        )

        # 🔥 GENERAR PDF
        pdf_buffer = pdf_report.generar_pdf_reporte(
            documento_db=db_doc,
            resultados_ia=db_doc.analisis_ia,
            resultado_normativo=resultado_normativo,
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            marca_producto=marca_prod,
            modelo_producto=modelo_prod
        )

        filename = f"Reporte_{marca_prod}_{tipo_clean}.pdf"
        filename = "".join(
            c for c in filename if c.isalnum() or c in (" ", ".", "_")
        ).strip()

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"❌ Error generando PDF: {e}")
        raise HTTPException(
            status_code=500,
            detail="Error generando el PDF"
        )
