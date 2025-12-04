from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# IMPORTACIONES ABSOLUTAS (REQUIEREN __init__.py)
from backend.routers import clientes, productos, documentos, auth, soporte
from backend.database import Base, engine
from backend import models


Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend NOPRO")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
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
    return {"mensaje": "Backend NOPRO funcionando en Render"}
