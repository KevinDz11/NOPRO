import os
from typing import List
import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.services.resultado_normativo import construir_resultado_normativo
from backend import crud, schemas, database, auth, models

router = APIRouter(prefix="/productos", tags=["Productos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

#ENDPOINT PARA LISTAR PRODUCTOS
@router.get("/", response_model=List[schemas.ProductoOut])
def listar_productos(
    db: Session = Depends(database.get_db),
    usuario=Depends(auth.get_current_user)
):
    productos = crud.obtener_productos_por_usuario(db, usuario.id)

    # 🔧 FIX: convertir analisis_ia de str → list
    for producto in productos:
        for documento in producto.documentos:
            if documento.analisis_ia and isinstance(documento.analisis_ia, str):
                try:
                    documento.analisis_ia = json.loads(documento.analisis_ia)
                except Exception as e:
                    print("❌ Error parseando analisis_ia:", e)
                    documento.analisis_ia = []  # fallback seguro

    return productos



#ENDPOINT PARA CREAR UN PRODUCTO
@router.post("/", response_model=schemas.ProductoOut)
def crear_producto(
    producto: schemas.ProductoCreate, 
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user) # Requiere autenticación
):
    try:
        return crud.create_producto(db=db, producto=producto, cliente_id=current_user.id_cliente)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear el producto: {str(e)}")
    
#ENDPOINT DE HISTORIAL POR USUARIO
@router.get("/me", response_model=List[schemas.ProductoOut])
def listar_productos_del_usuario(
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    productos = crud.get_productos_by_cliente(
        db,
        cliente_id=current_user.id_cliente
    )

    for producto in productos:
        for documento in producto.documentos:
            analisis = documento.analisis_ia or []
            if isinstance(analisis, str):
                try:
                    analisis = json.loads(analisis)
                except Exception:
                    analisis = []
            documento.analisis_ia = analisis

            documento.resultado_normativo = construir_resultado_normativo(
                categoria_producto=producto.nombre or "Laptop",
                tipo_documento="Ficha",  # o detecta por nombre si luego quieres
                resultados_ia=analisis
            )

    return productos


#ENDPOINT PARA SUBIR DOCUMENTOS
@router.post("/documentos/", response_model=schemas.DocumentoOut)
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
        documento_data = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )
        # Pasamos la URL del archivo por separado al CRUD
        return crud.create_documento(db, documento_data, archivo_url=file_path)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al subir documento: {str(e)}")

#ENDPOINT PARA LISTAR DOCUMENTOS
@router.get("/documentos/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)

@router.delete("/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(database.get_db)):
    # Lógica simple de borrado
    producto = db.query(models.Producto).filter(models.Producto.id_producto == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    db.delete(producto)
    db.commit()
    return {"mensaje": "Producto eliminado"}