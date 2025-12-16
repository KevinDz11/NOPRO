import os
import resend
from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/soporte", tags=["Soporte"])

class SupportRequest(BaseModel):
    name: str
    email: EmailStr 
    subject: str
    message: str

@router.post("/", status_code=status.HTTP_200_OK)
async def enviar_mensaje_soporte(
    request: SupportRequest,
    background_tasks: BackgroundTasks
):
    # Cargamos credenciales
    resend.api_key = os.getenv("RESEND_API_KEY")
    mail_from = os.getenv("MAIL_FROM")     # soporte@nopro.site
    admin_email = os.getenv("ADMIN_EMAIL") # sistema.nopro@gmail.com

    if not mail_from or not admin_email:
         raise HTTPException(status_code=500, detail="Error de configuración de email.")

    # Función interna para enviar en segundo plano
    def _enviar():
        try:
            resend.Emails.send({
                "from": mail_from,
                "to": [admin_email],
                "subject": f"Soporte NOPRO: {request.subject}",
                "html": f"""
                    <p><strong>De:</strong> {request.name} ({request.email})</p>
                    <p><strong>Mensaje:</strong></p>
                    <p>{request.message}</p>
                """,
                "reply_to": request.email  # <--- MAGIA: Respondes directo al usuario
            })
        except Exception as e:
            print(f"Error enviando soporte: {e}")

    background_tasks.add_task(_enviar)

    return {"mensaje": "Mensaje enviado. Te contactaremos pronto."}