import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
# IMPORTACIONES CORRECTAS (SIN PUNTOS)
from backend.routers import clientes, productos, documentos, auth, soporte, health
from backend.database import Base, engine
from backend import models


#Base.metadata.drop_all(bind=engine) 

# 2. Esta línea CREARÁ las tablas de nuevo (con la columna 'marca')
# Base.metadata.create_all(bind=engine)
# Crear tablas sólo si no existen

ENV = os.getenv("ENV", "dev")

app = FastAPI(
    title="Backend NOPRO",
    docs_url=None if ENV == "production" else "/docs",
    redoc_url=None if ENV == "production" else "/redoc",
    openapi_url=None if ENV == "production" else "/openapi.json",
)

@app.on_event("startup")
def startup_db():
    print("Creando tablas si no existen...")
    Base.metadata.create_all(bind=engine)

# Configuración de CORS para permitir solicitudes desde el frontend
origins = [
    "http://localhost:5173",  # La dirección de tu frontend en desarrollo
    "http://localhost:3000",
    "https://nopro-frontend.onrender.com",
    # Agrega aquí otras URL del frontend cuando esté
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploads_path = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_path, exist_ok=True) # Crear carpeta si no existe
app.mount("/uploads", StaticFiles(directory=uploads_path), name="uploads")

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(productos.router)
app.include_router(documentos.router)
app.include_router(soporte.router)
app.include_router(health.router)

@app.get("/")
def root():
    return {"mensaje": "Backend NOPRO corriendo con uploads"}