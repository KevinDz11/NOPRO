import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
from ..services import ia_analisis

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

        # 2. Crear registro inicial en BD (Sin análisis todavía)
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

            # --- PASO CRUCIAL: GUARDAR RESULTADOS EN LA BD ---
            if resultados_ia:
                crud.update_documento_analisis(db, doc_db.id_documento, resultados_ia)
                # Actualizamos el objeto local para retornarlo con datos
                doc_db.analisis_ia = resultados_ia

        return doc_db

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.get("/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)
