from fastapi import FastAPI
from .routers import clientes, productos, documentos
from .database import Base, engine
from backend.routers import clientes, productos, documentos

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Backend NOPRO 🚀")

app.include_router(clientes.router)
app.include_router(productos.router)
app.include_router(documentos.router)

@app.get("/")
def root():
    return {"mensaje": "Backend NOPRO corriendo con uploads 🚀"}
