from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# IMPORTACIONES CORRECTAS (SIN PUNTOS)
from backend.routers import clientes, productos, documentos, auth, soporte
from backend.database import Base, engine
from backend import models


Base.metadata.drop_all(bind=engine) 

# 2. Esta línea CREARÁ las tablas de nuevo (con la columna 'marca')
# Base.metadata.create_all(bind=engine)
# Crear tablas sólo si no existen
Base.metadata.create_all(bind=engine)
app = FastAPI(title="Backend NOPRO")

# Configuración de CORS para permitir solicitudes desde el frontend
origins = [
    "http://localhost:5173",  # La dirección de tu frontend en desarrollo
    "http://localhost:3000",  # Otra posible dirección si usas create-react-app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(clientes.router)
app.include_router(productos.router)
app.include_router(documentos.router)
app.include_router(soporte.router)

@app.get("/")
def root():
    return {"mensaje": "Backend NOPRO corriendo con uploads"}
