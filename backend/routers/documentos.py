import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
# IMPORTANTE: Asegúrate de importar pdf_report
from ..services import ia_analisis, pdf_report 
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/documentos", tags=["Documentos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Schema para el reporte general
class ReporteGeneralRequest(BaseModel):
    ids_documentos: List[int]

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
        doc_db = crud.create_documento(db, documento_data, archivo_url=file_path)

        resultados_ia = []
        if analizar and archivo.filename.lower().endswith(".pdf"):
            cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
            categoria_clean = cat_map.get(categoria.lower(), "Laptop")

            tipo_clean = "Ficha"
            if "manual" in tipo.lower(): tipo_clean = "Manual"
            elif "etiqueta" in tipo.lower(): tipo_clean = "Etiqueta"

            print(f"Analizando: {categoria_clean} - {tipo_clean}...")
            
            resultados_ia = ia_analisis.analizar_documento(
                file_path, tipo_clean, categoria_clean, marca_esperada=marca
            )

            if resultados_ia:
                crud.update_documento_analisis(db, doc_db.id_documento, resultados_ia)
                doc_db.analisis_ia = resultados_ia

        return doc_db

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# --- CAMBIO IMPORTANTE: response_model con análisis incluido para el Historial ---
@router.get("/", response_model=list[schemas.DocumentoAnalisisOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)

# --- REPORTE INDIVIDUAL ---
@router.get("/{id_documento}/reporte-pdf")
def descargar_reporte_pdf(
    id_documento: int,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    db_doc = db.query(models.Documento).filter(models.Documento.id_documento == id_documento).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if db_doc.id_cliente != current_user.id_cliente:
        raise HTTPException(status_code=403, detail="No autorizado")

    if not db_doc.analisis_ia:
        raise HTTPException(status_code=400, detail="Este documento no ha sido analizado aún.")

    producto = db.query(models.Producto).filter(models.Producto.id_producto == db_doc.id_producto).first()
    
    categoria_prod = "Laptop"
    marca_prod = "Marca Desconocida"
    modelo_prod = "Modelo Desconocido"

    if producto:
        categoria_prod = producto.nombre 
        marca_prod = producto.marca if producto.marca else "Genérico"
        modelo_prod = producto.descripcion if producto.descripcion else "Sin Modelo"

    cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    tipo_clean = "Ficha"
    nombre_doc = db_doc.nombre.lower()
    if "manual" in nombre_doc:
        tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc:
        tipo_clean = "Etiqueta"

    try:
        pdf_buffer = pdf_report.generar_pdf_reporte(
            documento_db=db_doc,
            resultados_ia=db_doc.analisis_ia,
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            marca_producto=marca_prod,   
            modelo_producto=modelo_prod  
        )
        
        filename = f"Reporte_{marca_prod}_{tipo_clean}.pdf"
        filename = "".join([c for c in filename if c.isalnum() or c in (' ', '.', '_')]).strip()
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generando el PDF: {str(e)}")

# --- NUEVO ENDPOINT PARA PDF GENERAL ---
@router.post("/reporte-general-pdf")
def descargar_reporte_general_pdf(
    payload: ReporteGeneralRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    ids = payload.ids_documentos
    if not ids:
        raise HTTPException(status_code=400, detail="No se enviaron documentos")

    # Obtener documentos
    docs = db.query(models.Documento).filter(models.Documento.id_documento.in_(ids)).all()
    if not docs:
        raise HTTPException(status_code=404, detail="No se encontraron los documentos")

    # Datos del producto (tomamos del primero)
    first_doc = docs[0]
    producto = db.query(models.Producto).filter(models.Producto.id_producto == first_doc.id_producto).first()
    
    marca_prod = producto.marca if producto and producto.marca else "Genérico"
    modelo_prod = producto.descripcion if producto and producto.descripcion else "Sin Modelo"
    categoria_prod = producto.nombre if producto else "Laptop"
    
    # Mapa de categorías
    cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    # Preparar lista para el servicio PDF
    lista_para_pdf = []
    for d in docs:
        if d.analisis_ia: # Solo incluir si tienen análisis
            lista_para_pdf.append({
                'doc': d,
                'resultados': d.analisis_ia
            })

    if not lista_para_pdf:
        raise HTTPException(status_code=400, detail="Ninguno de los documentos seleccionados tiene análisis IA")

    try:
        pdf_buffer = pdf_report.generar_pdf_reporte_general(
            lista_docs=lista_para_pdf,
            categoria_producto=categoria_clean,
            marca_producto=marca_prod,
            modelo_producto=modelo_prod
        )
        
        filename = f"Reporte_General_{marca_prod}.pdf"
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error PDF General: {e}")
        raise HTTPException(status_code=500, detail=str(e))