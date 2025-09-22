import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database

router = APIRouter(prefix="/documentos", tags=["Documentos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/", response_model=schemas.DocumentoOut)
def subir_documento(
    id_cliente: int = Form(...),
    id_producto: int = Form(...),
    nombre: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    try:
        # Guardar archivo en carpeta /uploads
        file_path = os.path.join(UPLOAD_DIR, archivo.filename)
        with open(file_path, "wb") as f:
            f.write(archivo.file.read())

        # Registrar documento en la BD
        documento = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )
        return crud.create_documento(db, documento, archivo_url=file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

@router.get("/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)
