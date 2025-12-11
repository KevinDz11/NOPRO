import os
import resend
from fastapi import APIRouter, status, BackgroundTasks, HTTPException
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/soporte", tags=["Soporte"])

# Configuración Resend
resend.api_key = os.getenv("RESEND_API_KEY")

# Correo desde donde sale el email (Resend)
MAIL_FROM = "onboarding@resend.dev"

# Correo al que llegan las quejas (Admin)
# Nota: En PedroCr se usa MAIL_FROM como admin por defecto si no existe MAIL_USERNAME.
# Aquí usamos MAIL_USERNAME que definiste en tu .env
ADMIN_EMAIL = os.getenv("MAIL_USERNAME", "sistema.nopro@gmail.com")

class SupportRequest(BaseModel):
    name: str
    email: EmailStr 
    subject: str
    message: str

def enviar_soporte_background(request: SupportRequest):
    try:
        # Formato de cuerpo igual o mejorado para claridad
        cuerpo = f"""
        Nuevo mensaje de soporte de NOPRO:

        De: {request.name}
        Email: {request.email}
        Asunto: {request.subject}

        Mensaje:
        {request.message}
        """
        
        resend.Emails.send({
            "from": f"Soporte Web <{MAIL_FROM}>",
            "to": [ADMIN_EMAIL],
            "subject": f"Soporte NOPRO: {request.subject}", # Asunto igualado a PedroCr
            "text": cuerpo,
            "reply_to": request.email # Importante: permite al admin responder directo al cliente
        })
        print(f"Soporte enviado de {request.email}")
    except Exception as e:
        print(f"Error soporte: {str(e)}")

@router.post("/", status_code=status.HTTP_200_OK)
async def enviar_mensaje_soporte(
    request: SupportRequest,
    background_tasks: BackgroundTasks
):
    # Usamos background tasks igual que PedroCr
    background_tasks.add_task(enviar_soporte_background, request)
    # Mensaje de retorno igualado
    return {"mensaje": "Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto."}