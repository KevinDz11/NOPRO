import os
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from backend import crud, schemas, database, auth, models
from pydantic import BaseModel, Field

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# --- CONFIGURACIÓN DE RESEND ---
resend.api_key = os.getenv("RESEND_API_KEY")

# URL del Frontend
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Configuración del remitente
MAIL_FROM_NAME = "NOPRO App"
MAIL_FROM_EMAIL = os.getenv("MAIL_FROM", "onboarding@resend.dev")
EMAIL_ADMIN_VERIFICADO = os.getenv("MAIL_USERNAME", "kvndzfs@gmail.com")


def enviar_email_resend(destinatario: str, asunto: str, mensaje: str):
    """Envía el correo usando Resend."""
    
    # --- TRUCO PARA MODO DESARROLLO (SANDBOX) ---
    # Si estamos probando, forzamos que el correo llegue a TI, 
    # sin importar qué correo puso el usuario en el registro.
    
    email_destino_final = destinatario
    
    # Detectamos si es un correo de prueba o si simplemente queremos forzar el desvío
    # Puedes comentar este 'if' cuando ya tengas tu dominio verificado en el futuro.
    if destinatario != EMAIL_ADMIN_VERIFICADO:
        print(f"⚠️ MODO SANDBOX: Desviando correo de {destinatario} a {EMAIL_ADMIN_VERIFICADO}")
        email_destino_final = EMAIL_ADMIN_VERIFICADO
        
        # Agregamos una nota al mensaje para que sepas de quién es
        mensaje = f"--- [CORREO ORIGINAL PARA: {destinatario}] ---\n\n" + mensaje

    try:
        r = resend.Emails.send({
            "from": f"NOPRO App <{MAIL_FROM_EMAIL}>",
            "to": email_destino_final,  # <--- Usamos el destino forzado
            "subject": asunto,
            "text": mensaje
        })
        print("Email enviado:", r)
    except Exception as e:
        print("Error enviando email:", e)

# --- SCHEMAS INTERNOS ---
class PasswordUpdateRequest(BaseModel):
    nueva_contrasena: str = Field(..., min_length=8)
    
class EmailRequest(BaseModel):
    email: str

class PasswordResetRequest(BaseModel):
    token: str
    nueva_contrasena: str = Field(..., min_length=8)
    
class VerificationRequest(BaseModel):
    email: str
    code: str

# --- ENDPOINTS ---

@router.post("/solicitar-reset-password", status_code=status.HTTP_200_OK)
async def solicitar_reset_password(
    request: EmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_cliente_by_email(db, email=request.email)
    
    if user:
        # Validación igual a PedroCr: Si existe pero no está verificado, error.
        if not user.estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta no ha sido verificada. Por favor, verifica tu correo antes de solicitar un cambio."
            )

        token = auth.create_reset_token()
        expires = datetime.now(timezone.utc) + timedelta(hours=1) 
        crud.set_reset_token(db, user, token, expires)

        reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
        
        # Texto igual a PedroCr
        cuerpo = (
            f"Hola {user.nombre},\n\n"
            f"Recibimos una solicitud para restablecer tu contraseña. "
            f"Haz clic en el siguiente enlace para continuar:\n\n{reset_link}\n\n"
            f"Si no solicitaste esto, puedes ignorar este correo.\n"
            f"El enlace expirará en 1 hora."
        )

        background_tasks.add_task(
            enviar_email_resend, 
            user.email, 
            "Restablece tu contraseña en NOPRO", 
            cuerpo
        )

    # Mensaje de retorno igual a PedroCr
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
    if crud.get_cliente_by_email(db, cliente.email):
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = crud.create_cliente(db, cliente)
    
    # Texto igual a PedroCr
    cuerpo = f"Hola {new_user.nombre},\n\nTu código de verificación es: {new_user.verification_code}\n\nGracias por registrarte."
    
    background_tasks.add_task(
        enviar_email_resend, 
        new_user.email, 
        "Verifica tu cuenta en NOPRO", 
        cuerpo
    )
    
    return new_user


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
    if not crud.delete_cliente(db=db, cliente_id=current_user.id_cliente):
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
    if not crud.delete_cliente(db, cliente_id):
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return {"mensaje": "Cliente eliminado correctamente"}


@router.post("/verificar", status_code=status.HTTP_200_OK)
def verificar_cuenta(request: VerificationRequest, db: Session = Depends(database.get_db)):
    user = crud.get_cliente_by_email(db, email=request.email)
    if not user: 
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if not user.verification_code or user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Código de verificación incorrecto")
    
    user.estado = True
    user.verification_code = None 
    db.commit()
    return {"mensaje": "Cuenta verificada correctamente."}


@router.post("/reenviar-verificacion", status_code=status.HTTP_200_OK)
async def reenviar_correo_verificacion(
    request: EmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_cliente_by_email(db, email=request.email)
    
    if not user: 
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    
    if user.estado: 
        raise HTTPException(status_code=400, detail="Esta cuenta ya ha sido verificada.")
    
    # Validación extra que tenía PedroCr y faltaba aquí
    if not user.verification_code:
        raise HTTPException(status_code=500, detail="Error: No se encontró un código para este usuario.")
    
    cuerpo = f"Hola {user.nombre},\n\nTu código de verificación es: {user.verification_code}\n\nGracias por registrarte."
    
    background_tasks.add_task(
        enviar_email_resend, 
        user.email, 
        "Verifica tu cuenta en NOPRO (Reenvío)", 
        cuerpo
    )
    
    return {"mensaje": "Correo de verificación reenviado con éxito."}


@router.put("/me/password", status_code=status.HTTP_200_OK)
def update_current_user_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    current_user.contrasena = auth.get_password_hash(request.nueva_contrasena)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente."}