import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv


# CARGA DE VARIABLES (SOLO AFECTA LOCAL)

load_dotenv()


# VARIABLES DE CONEXIÓN

DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "password")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "nopro_db")

# SSL: Azure requiere 'require', local usa 'disable'
DB_SSLMODE = os.getenv("DB_SSLMODE", "disable")

# CADENA DE CONEXIÓN

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    f"?sslmode={DB_SSLMODE}"
)


# SQLALCHEMY ENGINE

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,     # Reintenta conexiones caídas
    pool_recycle=1800,      # Evita timeouts largos
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


# DEPENDENCIA DE SESIÓN (FASTAPI)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
