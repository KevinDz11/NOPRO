import os
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from backend import crud, schemas, database
from pydantic import BaseModel, Field
from .. import crud, schemas, database, auth, models

router = APIRouter(prefix="/clientes", tags=["Clientes"])

# --- CONFIGURACIÓN DE RESEND ---
# Usamos la clave que guardaste en el paso anterior (la leerá de Render)
resend.api_key = os.getenv("RESEND_API_KEY")

# URL de tu página web (Frontend)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Correo "Desde" (En modo pruebas de Resend, SIEMPRE debe ser este)
MAIL_FROM = "onboarding@resend.dev"

# --- FUNCIONES ---

def enviar_email_resend(destinatario: str, asunto: str, mensaje: str):
    """Envía el correo usando Resend."""
    try:
        r = resend.Emails.send({
            "from": f"NOPRO App <{MAIL_FROM}>",
            "to": destinatario,
            "subject": asunto,
            "text": mensaje
        })
        print("Email enviado:", r)
    except Exception as e:
        print("Error enviando email:", e)

# --- MODELOS ---
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
        if not user.estado:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La cuenta no ha sido verificada."
            )

        token = auth.create_reset_token()
        expires = datetime.now(timezone.utc) + timedelta(hours=1) 
        crud.set_reset_token(db, user, token, expires)

        link = f"{FRONTEND_URL}/reset-password?token={token}"
        cuerpo = f"Hola {user.nombre},\n\nPara restablecer tu contraseña, haz clic aquí:\n{link}\n\nSi no fuiste tú, ignora este mensaje."

        # Enviamos en segundo plano
        background_tasks.add_task(enviar_email_resend, user.email, "Restablecer Contraseña", cuerpo)

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
    
    hashed = auth.get_password_hash(request.nueva_contrasena)
    crud.update_password_and_clear_token(db, user, hashed)
    return {"mensaje": "Contraseña actualizada."}    

@router.post("/", response_model=schemas.ClienteOut)
async def crear_cliente( 
    cliente: schemas.ClienteCreate, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    if crud.get_cliente_by_email(db, cliente.email):
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    new_user = crud.create_cliente(db, cliente)
    
    cuerpo = f"Hola {new_user.nombre},\n\nTu código de verificación es: {new_user.verification_code}\n\nGracias por registrarte."
    
    # Enviamos en segundo plano
    background_tasks.add_task(enviar_email_resend, new_user.email, "Verifica tu cuenta", cuerpo)
    
    return new_user

# ... (El resto de endpoints GET/DELETE se mantienen igual que tu archivo original)
@router.get("/", response_model=list[schemas.ClienteOut])
def listar_clientes(db: Session = Depends(database.get_db)):
    return crud.get_clientes(db)

@router.get("/me", response_model=schemas.ClienteOut)
def read_users_me(current_user: models.Cliente = Depends(auth.get_current_user)):
    return current_user

@router.delete("/me", status_code=status.HTTP_200_OK) 
def delete_current_user(db: Session = Depends(database.get_db), current_user: models.Cliente = Depends(auth.get_current_user)):
    if not crud.delete_cliente(db=db, cliente_id=current_user.id_cliente):
         raise HTTPException(status_code=404, detail="Error al eliminar.")
    return {"mensaje": "Cuenta eliminada."}

@router.get("/{cliente_id}", response_model=schemas.ClienteOut)
def obtener_cliente(cliente_id: int, db: Session = Depends(database.get_db)):
    cliente = crud.get_cliente(db, cliente_id)
    if not cliente: raise HTTPException(status_code=404, detail="No encontrado")
    return cliente

@router.delete("/{cliente_id}")
def eliminar_cliente(cliente_id: int, db: Session = Depends(database.get_db)):
    if not crud.delete_cliente(db, cliente_id):
        raise HTTPException(status_code=404, detail="No encontrado")
    return {"mensaje": "Eliminado"}

@router.post("/verificar", status_code=status.HTTP_200_OK)
def verificar_cuenta(request: VerificationRequest, db: Session = Depends(database.get_db)):
    user = crud.get_cliente_by_email(db, email=request.email)
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if user.verification_code != request.code:
        raise HTTPException(status_code=400, detail="Código incorrecto")
    user.estado = True
    user.verification_code = None 
    db.commit()
    return {"mensaje": "Verificada correctamente."}

@router.post("/reenviar-verificacion", status_code=status.HTTP_200_OK)
async def reenviar_correo_verificacion(
    request: EmailRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(database.get_db)
):
    user = crud.get_cliente_by_email(db, email=request.email)
    if not user: raise HTTPException(status_code=404, detail="Usuario no encontrado.")
    if user.estado: raise HTTPException(status_code=400, detail="Ya verificada.")
    
    cuerpo = f"Hola {user.nombre},\n\nTu código de verificación es: {user.verification_code}"
    background_tasks.add_task(enviar_email_resend, user.email, "Reenvío Código", cuerpo)
    return {"mensaje": "Correo reenviado."}

@router.put("/me/password", status_code=status.HTTP_200_OK)
def update_current_user_password(
    request: PasswordUpdateRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    current_user.contrasena = auth.get_password_hash(request.nueva_contrasena)
    db.commit()
    return {"mensaje": "Contraseña actualizada."}