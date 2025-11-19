# crear_usuario_test.py
from backend.database import SessionLocal
from backend.models import Cliente
from backend.auth import get_password_hash

def crear_usuario_prueba():
    db = SessionLocal()

    # --- DATOS DEL USUARIO DE PRUEBA ---
    nombre = "User"
    email = "test@nopro.com"
    password_plano = "A1234567"  # La contraseña que usarás para loguearte
    
    # 1. Verificar si ya existe
    usuario_existente = db.query(Cliente).filter(Cliente.email == email).first()
    if usuario_existente:
        print(f"❌ El usuario {email} ya existe.")
        return

    # 2. Encriptar la contraseña (CRUCIAL)
    hashed_password = get_password_hash(password_plano)

    # 3. Crear el objeto Cliente
    # IMPORTANTE: Ponemos estado=True para saltarnos la verificación de correo
    nuevo_cliente = Cliente(
        nombre=nombre,
        email=email,
        contrasena=hashed_password,
        estado=True 
    )

    # 4. Guardar en BD
    try:
        db.add(nuevo_cliente)
        db.commit()
        db.refresh(nuevo_cliente)
        print(f"✅ Usuario creado con éxito!")
        print(f"   ID: {nuevo_cliente.id_cliente}")
        print(f"   Email: {email}")
        print(f"   Pass: {password_plano}")
        print(f"   Estado: Activo (No requiere verificación)")
    except Exception as e:
        print(f"❌ Error al crear usuario: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    crear_usuario_prueba()