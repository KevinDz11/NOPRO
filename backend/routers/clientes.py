import os
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from backend import crud, schemas, database, auth, models
# IMPORTAMOS TU NUEVO SERVICIO
from backend.services.email_service import send_email

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# --- SE ELIMINÓ LA CONFIGURACIÓN VIEJA DE FASTAPI-MAIL ---

class PasswordUpdateRequest(BaseModel):
    nueva_contrasena: str = Field(..., min_length=8)
    
class EmailRequest(BaseModel):
    email: str

class PasswordResetRequest(BaseModel):
    token: str
    nueva_contrasena: str = Field(..., min_length=8)
    
@router.post("/solicitar-reset-password", status_code=status.HTTP_200_OK)
async def solicitar_reset_password(
    request: EmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_cliente_by_email(db, email=request.email)
    
    if user:
        if not user.estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta no ha sido verificada. Verifica tu correo antes de continuar."
            )

        token = auth.create_reset_token()
        expires = datetime.now(timezone.utc) + timedelta(hours=1) 
        crud.set_reset_token(db, user, token, expires)

        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"

        # --- ENVÍO CON RESEND ---
        subject = "Restablece tu contraseña en NOPRO"
        body = f"""
        <h1>Hola {user.nombre},</h1>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Haz clic aquí: <a href="{reset_link}">Restablecer Contraseña</a></p>
        <p><small>Este enlace expira en 1 hora.</small></p>
        """
        
        background_tasks.add_task(send_email, user.email, subject, body)

    return {"mensaje": "Si el correo existe, recibirás las instrucciones."}


@router.post("/ejecutar-reset-password", status_code=status.HTTP_200_OK)
def ejecutar_reset_password(
    request: PasswordResetRequest, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_reset_token(db, token=request.token)

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido.")

    if not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado.")
    
    hashed_password = auth.get_password_hash(request.nueva_contrasena)
    crud.update_password_and_clear_token(db, user, hashed_password)
    
    return {"mensaje": "Contraseña actualizada correctamente."}    

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

    # --- ENVÍO CON RESEND ---
    subject = "Verifica tu cuenta en NOPRO"
    body = f"""
    <h1>Bienvenido a NOPRO, {db_cliente.nombre}</h1>
    <p>Tu código de verificación es:</p>
    <h2 style="color: #2563eb;">{db_cliente.verification_code}</h2>
    """

    background_tasks.add_task(send_email, db_cliente.email, subject, body)
    
    return db_cliente

@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(database.get_db)):
    return crud.get_clientes(db)

@router.get("/me", response_model=schemas.ClienteOut)
def read_users_me(current_user: models.Cliente = Depends(auth.get_current_user)):
    """Devuelve la información del usuario actualmente logueado."""
    return current_user

@router.delete("/me", status_code=status.HTTP_200_OK) 
def delete_current_user(
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    deleted_user = crud.delete_cliente(db=db, cliente_id=current_user.id_cliente)
    if not deleted_user:
         raise HTTPException(status_code=404, detail="Usuario no encontrado para eliminar.")
    
    return {"mensaje": "Cuenta eliminada correctamente."}

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


@router.post("/reenviar-verificacion", status_code=status.HTTP_200_OK)
async def reenviar_correo_verificacion(
    request: EmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    cliente = crud.get_cliente_by_email(db, email=request.email)

    if not cliente:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    if cliente.estado:
        raise HTTPException(status_code=400, detail="Cuenta ya verificada.")

    # --- ENVÍO CON RESEND ---
    subject = "Código de verificación NOPRO"
    body = f"""
    <p>Hola {cliente.nombre}, aquí tienes tu código nuevamente:</p>
    <h2>{cliente.verification_code}</h2>
    """

    background_tasks.add_task(send_email, cliente.email, subject, body)
    
    return {"mensaje": "Correo reenviado con éxito."}


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


