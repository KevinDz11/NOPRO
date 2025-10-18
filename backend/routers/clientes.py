from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import crud, schemas, database
from pydantic import BaseModel
from .. import auth, models

router = APIRouter(prefix="/clientes", tags=["Clientes"])

@router.post("/", response_model=schemas.ClienteOut)
def crear_cliente(cliente: schemas.ClienteCreate, db: Session = Depends(database.get_db)):
    return crud.create_cliente(db, cliente)

@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(database.get_db)):
    return crud.get_clientes(db)

@router.get("/{cliente_id}", response_model=schemas.ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(database.get_db)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(database.get_db)):
    cliente = crud.delete_cliente(db, cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado correctamente"}

class VerificationRequest(BaseModel):
    email: str
    code: str

@router.post("/verificar", status_code=status.HTTP_200_OK)
def verificar_cuenta(request: VerificationRequest, db: Session = Depends(database.get_db)):
    # Lógica de simulación: el código siempre es 123456
    if request.code != "123456":
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto")
        
    cliente = crud.get_cliente_by_email(db, email=request.email)
    if not cliente:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # Activa la cuenta del cliente
    cliente.estado = True
    db.commit()
    
    return {"mensaje": "Cuenta verificada correctamente."}

@router.get("/me", response_model=schemas.ClienteOut)
def read_users_me(current_user: models.Cliente = Depends(auth.get_current_user)):
    """Devuelve la información del usuario actualmente logueado."""
    return current_user