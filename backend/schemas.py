from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

# --- 1. SCHEMAS DE RESULTADOS IA Y DOCUMENTOS ---
class ResultadoIA(BaseModel):
    Norma: str
    Categoria: str
    Hallazgo: Optional[str] = None
    Pagina: int
    Contexto: Optional[str] = None
    ImagenBase64: Optional[str] = None

class DocumentoBase(BaseModel):
    nombre: str
    archivo_url: str

class DocumentoCreate(BaseModel):
    id_cliente: int
    id_producto: int
    nombre: str

class DocumentoOut(BaseModel):
    id_documento: int
    nombre: str
    archivo_url: str
    analisis_ia: List[Any] = []  # 🔥 OBLIGATORIO

    class Config:
        from_attributes = True

# Schema extendido que INCLUYE el análisis
class DocumentoAnalisisOut(DocumentoOut):
    analisis_ia: list
    resultado_normativo: list | None = None


# --- 2. SCHEMAS DE PRODUCTO ---
class ProductoBase(BaseModel):
    nombre: str
    marca: Optional[str] = None
    descripcion: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoOut(BaseModel):
    id_producto: int
    nombre: str
    marca: Optional[str]             
    descripcion: Optional[str]
    fecha_registro: Optional[datetime]
    # IMPORTANTE: Usamos DocumentoAnalisisOut para que viaje la info de la IA
    documentos: List[DocumentoAnalisisOut] = [] 
    
    class Config:
        from_attributes = True

# --- 3. SCHEMAS DE CLIENTE ---
class ClienteBase(BaseModel):
    nombre: str
    email: str
    contrasena: str

class ClienteCreate(ClienteBase):
    pass

class ClienteOut(BaseModel):
    id_cliente: int
    nombre: str
    email: str
    estado: bool
    
    class Config:
        from_attributes = True

# --- 4. OTROS ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    
class DocumentoBasicoOut(BaseModel):
    id_documento: int
    nombre: str
    archivo_url: str

    class Config:
        from_attributes = True


class DocumentoMeOut(BaseModel):
    id_documento: int
    nombre: str
    archivo_url: str
    analisis_ia: List[dict] = []   # 🔥 JAMÁS None

    class Config:
        from_attributes = True



