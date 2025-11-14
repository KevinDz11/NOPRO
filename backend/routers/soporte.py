import os
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# Copiamos la configuración de email que ya tienes en clientes.py
# (Asegúrate de que las variables de entorno estén cargadas en index.py)
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

router = APIRouter(prefix="/soporte", tags=["Soporte"])

class SupportRequest(BaseModel):
    """Schema Pydantic para los datos del formulario de contacto."""
    name: str
    email: EmailStr 
    subject: str
    message: str

@router.post("/", status_code=status.HTTP_200_OK)
async def enviar_mensaje_soporte(
    request: SupportRequest,
    background_tasks: BackgroundTasks
):
    """
    Recibe un mensaje de soporte y lo envía 
    al correo del administrador.
    """
    # El correo del administrador (el mismo que usas para enviar)
    admin_email = os.getenv("MAIL_FROM", "sistema.nopro@gmail.com")

    # Formateamos el cuerpo del email
    body = f"""
    Nuevo mensaje de soporte de NOPRO:

    De: {request.name}
    Email: {request.email}
    Asunto: {request.subject}

    Mensaje:
    {request.message}
    """

    message = MessageSchema(
        subject=f"Soporte NOPRO: {request.subject}", # Asunto del correo
        recipients=[admin_email],  # Se envía al correo del admin
        body=body,
        subtype="plain",
        # Opcional: Permite al admin "Responder" directamente al usuario
        headers={"Reply-To": request.email} 
    )

    try:
        fm = FastMail(conf)
        # Usamos BackgroundTasks para no hacer esperar al usuario
        background_tasks.add_task(fm.send_message, message)
        return {"mensaje": "Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto."}
    except Exception as e:
        # Captura cualquier error si FastMail falla
        raise HTTPException(status_code=500, detail=f"Error al enviar el correo: {str(e)}")