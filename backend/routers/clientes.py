import os
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from backend import crud, schemas, database
from pydantic import BaseModel, Field
from .. import crud, schemas, database, auth, models
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

router = APIRouter(prefix="/clientes", tags=["Clientes"])

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

class PasswordUpdateRequest(BaseModel):
    nueva_contrasena: str = Field(..., min_length=8)

@router.post("/", response_model=schemas.ClienteOut)
async def crear_cliente( 
    cliente: schemas.ClienteCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    db_cliente = crud.get_cliente_by_email(db, cliente.email)
    if db_cliente:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    db_cliente = crud.create_cliente(db, cliente)

    message = MessageSchema(
        subject="Verifica tu cuenta en NOPRO",
        recipients=[db_cliente.email],
        body=f"Hola {db_cliente.nombre},\n\nTu código de verificación es: {db_cliente.verification_code}\n\nGracias por registrarte.",
        subtype="plain"
    )

    fm = FastMail(conf)
    # Usar background_tasks para no bloquear la respuesta
    background_tasks.add_task(fm.send_message, message) 
    
    return db_cliente

@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(database.get_db)):
    return crud.get_clientes(db)

@router.get("/me", response_model=schemas.ClienteOut)
def read_users_me(current_user: models.Cliente = Depends(auth.get_current_user)):
    """Devuelve la información del usuario actualmente logueado."""
    return current_user

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
    
    cliente = crud.get_cliente_by_email(db, email=request.email)
    if not cliente:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not cliente.verification_code or cliente.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto")

    cliente.estado = True
    cliente.verification_code = None 
    db.commit()
    
    return {"mensaje": "Cuenta verificada correctamente."}


@router.put("/me/password", status_code=status.HTTP_200_OK)
def update_current_user_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    hashed_password = auth.get_password_hash(request.nueva_contrasena)
    
    current_user.contrasena = hashed_password
    db.commit()
    
    return {"mensaje": "Contraseña actualizada correctamente."}


@router.delete("/me", status_code=status.HTTP_200_OK) 
def delete_current_user(
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    deleted_user = crud.delete_cliente(db=db, cliente_id=current_user.id_cliente)
    if not deleted_user:
         raise HTTPException(status_code=404, detail="Usuario no encontrado para eliminar.")
    
    return {"mensaje": "Cuenta eliminada correctamente."}