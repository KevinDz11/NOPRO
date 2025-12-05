import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv
from urllib.parse import quote_plus

# -------------------------
# Cargar variables de entorno
# -------------------------
load_dotenv()

DB_USER = os.getenv("DB_USER").strip()
DB_PASSWORD = os.getenv("DB_PASSWORD").strip()
DB_HOST = os.getenv("DB_HOST").strip()
DB_PORT = os.getenv("DB_PORT").strip()
DB_NAME = os.getenv("DB_NAME").strip()

# DEBUG: imprimir variables
print("Variables cargadas:")
print([DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME])

# Escapar caracteres especiales
DB_USER_ENC = quote_plus(DB_USER)
DB_PASSWORD_ENC = quote_plus(DB_PASSWORD)

# URL de conexión sin base de datos para crear DB si no existe
DATABASE_URL_MASTER = f"postgresql+psycopg2://{DB_USER_ENC}:{DB_PASSWORD_ENC}@{DB_HOST}:{DB_PORT}/postgres"

# URL final con base de datos
DATABASE_URL = f"postgresql+psycopg2://{DB_USER_ENC}:{DB_PASSWORD_ENC}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# -------------------------
# Crear base de datos si no existe
# -------------------------
engine_master = create_engine(DATABASE_URL_MASTER, isolation_level="AUTOCOMMIT")

try:
    with engine_master.connect() as conn:
        result = conn.execute(text(f"SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'"))
        exists = result.scalar()
        if not exists:
            print(f"⚡ La base de datos '{DB_NAME}' no existe. Creando...")
            conn.execute(text(f'CREATE DATABASE "{DB_NAME}"'))
            print("✅ Base de datos creada")
        else:
            print(f"✅ La base de datos '{DB_NAME}' ya existe")
except Exception as e:
    print("❌ Error verificando o creando la base de datos:", e)
finally:
    engine_master.dispose()

# -------------------------
# Conexión final a la DB
# -------------------------
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Test de conexión
try:
    with engine.connect() as conn:
        print("✅ Conexión a PostgreSQL con la base de datos exitosa")
except Exception as e:
    print("❌ Error de conexión a la base de datos:", e)

# -------------------------
# Función para obtener sesión
# -------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
