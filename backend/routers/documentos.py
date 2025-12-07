import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
# IMPORTANTE: Asegúrate de importar pdf_report
from ..services import ia_analisis, pdf_report 

router = APIRouter(prefix="/documentos", tags=["Documentos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

        # 1. Guardar archivo físico
        file_path = os.path.join(UPLOAD_DIR, archivo.filename)
        with open(file_path, "wb") as f:
            f.write(archivo.file.read())

        # 2. Crear registro inicial en BD
        documento_data = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )
        doc_db = crud.create_documento(db, documento_data, archivo_url=file_path)

        # 3. EJECUTAR ANÁLISIS IA
        resultados_ia = []
        if analizar and archivo.filename.lower().endswith(".pdf"):
            cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
            categoria_clean = cat_map.get(categoria.lower(), "Laptop")

            tipo_clean = "Ficha"
            if "manual" in tipo.lower(): tipo_clean = "Manual"
            elif "etiqueta" in tipo.lower(): tipo_clean = "Etiqueta"

            print(f"Analizando: {categoria_clean} - {tipo_clean}...")
            
            # Ejecutar cerebro
            resultados_ia = ia_analisis.analizar_documento(
                file_path, tipo_clean, categoria_clean, marca_esperada=marca
            )

            # --- Guardar Resultados ---
            if resultados_ia:
                crud.update_documento_analisis(db, doc_db.id_documento, resultados_ia)
                doc_db.analisis_ia = resultados_ia

        return doc_db

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)

# --- ENDPOINT DE PDF ACTUALIZADO ---
@router.get("/{id_documento}/reporte-pdf")
def descargar_reporte_pdf(
    id_documento: int,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    # 1. Obtener documento
    db_doc = db.query(models.Documento).filter(models.Documento.id_documento == id_documento).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    # 2. Validar propiedad
    if db_doc.id_cliente != current_user.id_cliente:
        raise HTTPException(status_code=403, detail="No autorizado")

    if not db_doc.analisis_ia:
        raise HTTPException(status_code=400, detail="Este documento no ha sido analizado aún.")

    # 3. OBTENER DATOS DEL PRODUCTO (MARCA Y MODELO)
    producto = db.query(models.Producto).filter(models.Producto.id_producto == db_doc.id_producto).first()
    
    # Datos por defecto si no se encuentran
    categoria_prod = "Laptop"
    marca_prod = "Marca Desconocida"
    modelo_prod = "Modelo Desconocido"

    if producto:
        categoria_prod = producto.nombre # Asumimos que 'nombre' es la categoría (Laptop, etc)
        marca_prod = producto.marca if producto.marca else "Genérico"
        modelo_prod = producto.descripcion if producto.descripcion else "Sin Modelo"

    # 4. Determinar Categoria y Tipo de Documento para el Checklist
    cat_map = {
        "laptop": "Laptop", 
        "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", 
        "luminaria": "Luminaria"
    }
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    # Lógica para saber si es Ficha, Manual o Etiqueta
    # Usamos el nombre del archivo o una lógica guardada.
    # Aquí inferimos del nombre del documento para simplificar
    tipo_clean = "Ficha"
    nombre_doc = db_doc.nombre.lower()
    if "manual" in nombre_doc:
        tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc:
        tipo_clean = "Etiqueta"

    # 5. Generar PDF
    try:
        pdf_buffer = pdf_report.generar_pdf_reporte(
            documento_db=db_doc,
            resultados_ia=db_doc.analisis_ia,
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            marca_producto=marca_prod,   # <-- Pasamos la marca real
            modelo_producto=modelo_prod  # <-- Pasamos el modelo real
        )
        
        filename = f"Reporte_{marca_prod}_{tipo_clean}.pdf"
        # Limpiar caracteres inválidos en nombre de archivo
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