import os
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from .. import crud, schemas, database, auth, models

# Servicios
from ..services import ia_analisis, pdf_report
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

        resultados_ia = []
        resultado_normativo = []

        if analizar and archivo.filename.lower().endswith(".pdf"):
            cat_map = {
                "laptop": "Laptop",
                "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV",
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
                crud.update_documento_analisis(db, doc_db.id_documento, resultados_ia)

        doc_db.analisis_ia = resultados_ia
        doc_db.resultado_normativo = resultado_normativo

        return doc_db

    except Exception as e:
        print(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# ============================================================
# LISTAR DOCUMENTOS
# ============================================================
@router.get("/", response_model=list[schemas.DocumentoAnalisisOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)

# ============================================================
# REPORTE PDF GENERAL (ARREGLADO)
# ============================================================
@router.post("/reporte-general-pdf")
def generar_reporte_general_pdf(
    data: ReporteGeneralRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    try:
        # 1. Obtener documentos
        documentos = db.query(models.Documento).filter(
            models.Documento.id_documento.in_(data.ids_documentos),
            models.Documento.id_cliente == current_user.id_cliente
        ).all()

        if not documentos:
            raise HTTPException(status_code=404, detail="No se encontraron documentos válidos")

        # 2. Construir estructura
        bloques_documentos = []
        cat_map = {
            "laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", 
            "tv": "SmartTV", "luminaria": "Luminaria"
        }

        for doc in documentos:
            producto = db.query(models.Producto).filter(
                models.Producto.id_producto == doc.id_producto
            ).first()

            categoria_raw = producto.nombre.lower() if producto else "laptop"
            categoria_clean = cat_map.get(categoria_raw, "Laptop")
            marca_prod = producto.marca if (producto and producto.marca) else "Genérico"
            modelo_prod = producto.descripcion if producto else "Sin modelo"

            nombre_doc = doc.nombre.lower()
            tipo_clean = "Ficha"
            if "manual" in nombre_doc: tipo_clean = "Manual"
            elif "etiqueta" in nombre_doc: tipo_clean = "Etiqueta"

            resultados_ia = doc.analisis_ia if doc.analisis_ia else []

            resultado_normativo = construir_resultado_normativo(
                categoria_producto=categoria_clean,
                tipo_documento=tipo_clean,
                resultados_ia=resultados_ia
            )

            bloques_documentos.append({
                "documento": doc,
                "resultados_ia": resultados_ia,
                "resultado_normativo": resultado_normativo,
                "categoria": categoria_clean,
                "tipo": tipo_clean,
                "marca": marca_prod,
                "modelo": modelo_prod
            })

        # 3. Generar PDF
        print(f"📄 Generando PDF unificado para {len(bloques_documentos)} docs...")
        
        pdf_buffer = pdf_report.generar_pdf_reporte_general(
            lista_docs=bloques_documentos,
            categoria_producto="Reporte Unificado",
            marca_producto="Multi-Marca",
            modelo_producto="Varios"
        )

        # 🔥 FIX CRITICO: Regresar al inicio del archivo
        pdf_buffer.seek(0)

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=Reporte_General_Unificado.pdf"}
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"❌ Error PDF general: {e}")
        # 🔥 FIX CRITICO: Convertir error a string simple
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

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

    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == db_doc.id_producto
    ).first()

    categoria_prod = producto.nombre if producto else "Laptop"
    marca_prod = producto.marca if producto and producto.marca else "Genérico"
    modelo_prod = producto.descripcion if producto else "Sin Modelo"

    cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    nombre_doc = db_doc.nombre.lower()
    tipo_clean = "Ficha"
    if "manual" in nombre_doc: tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc: tipo_clean = "Etiqueta"

    try:
        analisis_ia = db_doc.analisis_ia if db_doc.analisis_ia else []
        
        resultado_normativo = construir_resultado_normativo(
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            resultados_ia=analisis_ia
        )

        pdf_buffer = pdf_report.generar_pdf_reporte(
            documento_db=db_doc,
            resultados_ia=analisis_ia,
            resultado_normativo=resultado_normativo,
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            marca_producto=marca_prod,
            modelo_producto=modelo_prod
        )
        
        # 🔥 FIX IMPORTANTE TAMBIÉN AQUÍ
        pdf_buffer.seek(0)

        filename = f"Reporte_{marca_prod}_{tipo_clean}.pdf"
        filename = "".join(c for c in filename if c.isalnum() or c in (" ", ".", "_")).strip()

        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        print(f"❌ Error generando PDF individual: {e}")
        raise HTTPException(status_code=500, detail=f"Error PDF: {str(e)}")

# ============================================================
# DETALLE DE DOCUMENTO (JSON)
# ============================================================
@router.get("/{id_documento}", response_model=schemas.DocumentoAnalisisOut)
def obtener_detalle_documento(
    id_documento: int,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    doc = db.query(models.Documento).filter(
        models.Documento.id_documento == id_documento,
        models.Documento.id_cliente == current_user.id_cliente
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    producto = db.query(models.Producto).filter(
        models.Producto.id_producto == doc.id_producto
    ).first()

    categoria_clean = "Laptop"
    if producto:
        cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
        categoria_clean = cat_map.get(producto.nombre.lower(), "Laptop")

    nombre_doc = doc.nombre.lower()
    tipo_clean = "Ficha"
    if "manual" in nombre_doc: tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc: tipo_clean = "Etiqueta"

    analisis_ia = doc.analisis_ia or []
    if isinstance(analisis_ia, str):
        try:
            analisis_ia = json.loads(analisis_ia)
        except Exception:
            analisis_ia = []

    resultado_normativo = construir_resultado_normativo(
        categoria_producto=categoria_clean,
        tipo_documento=tipo_clean,
        resultados_ia=analisis_ia
    )

    doc.resultado_normativo = resultado_normativo
    return doc