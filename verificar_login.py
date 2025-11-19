from backend.database import SessionLocal
from backend.models import Cliente
from backend.auth import verify_password

def probar_login_manual():
    db = SessionLocal()
    email = "test@nopro.com"
    pass_plano = "A1234567"

    print(f"\n--- DIAGNÓSTICO DE USUARIO: {email} ---")
    
    user = db.query(Cliente).filter(Cliente.email == email).first()
    
    if not user:
        print("❌ EL USUARIO NO EXISTE EN LA BASE DE DATOS.")
        print("   Causa probable: El script de creación falló o estás conectado a otra BD.")
        return

    print(f"✅ Usuario encontrado ID: {user.id_cliente}")
    print(f"   Estado (Activo): {user.estado}")
    print(f"   Hash guardado: {user.contrasena[:15]}...")

    # Prueba de contraseña
    try:
        es_correcta = verify_password(pass_plano, user.contrasena)
    except Exception as e:
        print(f"❌ Error al verificar hash: {e}")
        return

    if es_correcta:
        print("\n✅ LA CONTRASEÑA ES CORRECTA (A nivel base de datos).")
        print("   CONCLUSIÓN: El problema NO es tu usuario ni contraseña.")
        print("   CAUSA: Tu Frontend (React) no está enviando los datos como el Backend espera.")
    else:
        print("\n❌ LA CONTRASEÑA NO COINCIDE.")
        print("   SOLUCIÓN: Borra el usuario manualmente o en SQL y vuelve a crearlo.")

if __name__ == "__main__":
    probar_login_manual()