from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend import crud, schemas, database
from pydantic import BaseModel, Field
from .. import crud, schemas, database, auth, models

router = APIRouter(prefix="/clientes", tags=["Clientes"])

class PasswordUpdateRequest(BaseModel):
    nueva_contrasena: str = Field(..., min_length=8)

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

# --- Endpoint para Cambiar Contraseña del Usuario Logueado ---
@router.put("/me/password", status_code=status.HTTP_200_OK)
def update_current_user_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    # Encripta la nueva contraseña
    hashed_password = auth.get_password_hash(request.nueva_contrasena)
    
    # Actualiza la contraseña en la base de datos
    current_user.contrasena = hashed_password
    db.commit()
    
    return {"mensaje": "Contraseña actualizada correctamente."}

# --- Endpoint para Eliminar la Propia Cuenta del Usuario Logueado ---
@router.delete("/me", status_code=status.HTTP_200_OK) 
def delete_current_user(
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    # Llama a la función crud para eliminar
    deleted_user = crud.delete_cliente(db=db, cliente_id=current_user.id_cliente)
    if not deleted_user:
        # Esto no debería pasar si el token es válido, pero es buena práctica verificar
         raise HTTPException(status_code=404, detail="Usuario no encontrado para eliminar.")
    
    return {"mensaje": "Cuenta eliminada correctamente."}