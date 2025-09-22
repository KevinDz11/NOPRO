import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from backend import crud, schemas, database  # usa import absoluto

router = APIRouter(prefix="/productos", tags=["Productos"])

# Carpeta de uploads relativa a la raíz del proyecto
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Endpoint para subir documentos
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
            nombre=nombre,
            archivo_url=file_path
        )
        return crud.create_documento(db, documento)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

# Endpoint para listar documentos
@router.get("/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)
