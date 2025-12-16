import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")
MAIL_FROM = os.getenv("MAIL_FROM")

def send_email(to_email: str, subject: str, body: str):
    """
    Envía correos transaccionales (Bienvenida, Reset Password)
    usando tu dominio nopro.site
    """
    if not MAIL_FROM:
        print("Error: MAIL_FROM no está configurado en .env")
        return None

    try:
        params = {
            "from": MAIL_FROM,
            "to": [to_email],
            "subject": subject,
            "html": body.replace("\n", "<br>") # Convierte saltos de línea a HTML simple
        }
        
        email = resend.Emails.send(params)
        print(f"Correo enviado a {to_email}: {email}")
        return email
        
    except Exception as e:
        print(f"Error enviando correo a {to_email}: {str(e)}")
        return None