import os
import resend
from fastapi import APIRouter, status, BackgroundTasks
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/soporte", tags=["Soporte"])

# Configuración
resend.api_key = os.getenv("RESEND_API_KEY")
MAIL_FROM = "onboarding@resend.dev"
# A este correo le llegarán las quejas (debe ser el tuyo)
ADMIN_EMAIL = os.getenv("MAIL_USERNAME") 

class SupportRequest(BaseModel):
    name: str
    email: EmailStr 
    subject: str
    message: str

def enviar_soporte_background(request: SupportRequest):
    try:
        cuerpo = f"""
        NUEVO MENSAJE DE SOPORTE
        ------------------------
        De: {request.name} ({request.email})
        Asunto: {request.subject}
        
        MENSAJE:
        {request.message}
        """
        resend.Emails.send({
            "from": f"Soporte Web <{MAIL_FROM}>",
            "to": [ADMIN_EMAIL],
            "subject": f"[Soporte] {request.subject}",
            "text": cuerpo,
            "reply_to": request.email # Al responder, le respondes al cliente
        })
        print(f"Soporte enviado de {request.email}")
    except Exception as e:
        print(f"Error soporte: {str(e)}")

@router.post("/", status_code=status.HTTP_200_OK)
async def enviar_mensaje_soporte(
    request: SupportRequest,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(enviar_soporte_background, request)
    return {"mensaje": "Mensaje enviado."}