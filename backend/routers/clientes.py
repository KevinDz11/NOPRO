import os
from datetime import datetime, timedelta, timezone
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
        # --- INICIO DE LA CORRECCIÓN ---
        # Si el usuario existe pero no ha verificado su cuenta, lanzamos un error.
        if not user.estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta no ha sido verificada. Por favor, verifica tu correo antes de solicitar un cambio."
            )
        # --- FIN DE LA CORRECCIÓN ---

        token = auth.create_reset_token()
        # El token expira en 1 hora
        expires = datetime.now(timezone.utc) + timedelta(hours=1) 
        crud.set_reset_token(db, user, token, expires)

        reset_link = f"http://localhost:5173/reset-password?token={token}"

        message = MessageSchema(
            subject="Restablece tu contraseña en NOPRO",
            recipients=[user.email],
            body=f"Hola {user.nombre},\n\n"
                 f"Recibimos una solicitud para restablecer tu contraseña. "
                 f"Haz clic en el siguiente enlace para continuar:\n\n{reset_link}\n\n"
                 f"Si no solicitaste esto, puedes ignorar este correo.\n"
                 f"El enlace expirará en 1 hora.",
            subtype="plain"
        )
        fm = FastMail(conf)
        background_tasks.add_task(fm.send_message, message)

    # Nota: Por seguridad, a veces se prefiere no revelar si el usuario existe o no,
    # pero como en el bloque 'if' ya lanzamos una excepción específica si no está verificado,
    # el frontend recibirá ese error 400 y mostrará el mensaje.
    return {"mensaje": "Si tu correo está registrado y verificado, recibirás un enlace para restablecer tu contraseña."}


@router.post("/ejecutar-reset-password", status_code=status.HTTP_200_OK)
def ejecutar_reset_password(
    request: PasswordResetRequest, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_user_by_reset_token(db, token=request.token)

    if not user:
        raise HTTPException(status_code=400, detail="Token inválido.")

    if not user.reset_token_expires or user.reset_token_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expirado. Por favor, solicita uno nuevo.")
    
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

    message = MessageSchema(
        subject="Verifica tu cuenta en NOPRO",
        recipients=[db_cliente.email],
        body=f"Hola {db_cliente.nombre},\n\nTu código de verificación es: {db_cliente.verification_code}\n\nGracias por registrarte.",
        subtype="plain"
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message) 
    
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
        raise HTTPException(status_code=400, detail="Esta cuenta ya ha sido verificada.")

    if not cliente.verification_code:
        raise HTTPException(status_code=500, detail="Error: No se encontró un código para este usuario.")

    message = MessageSchema(
        subject="Verifica tu cuenta en NOPRO (Reenvío)",
        recipients=[cliente.email],
        body=f"Hola {cliente.nombre},\n\nTu código de verificación es: {cliente.verification_code}\n\nGracias por registrarte.",
        subtype="plain"
    )

    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message) 
    
    return {"mensaje": "Correo de verificación reenviado con éxito."}


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


