from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Cliente
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
        from_attributes = True # <-- CORRECCIÓN

# Producto
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
    
    class Config:
        from_attributes = True # <-- CORRECCIÓN

# Documento
class DocumentoBase(BaseModel):
    nombre: str
    archivo_url: str

class DocumentoCreate(BaseModel): # <-- CAMBIO MODIFICADO (quitamos herencia)
    id_cliente: int
    id_producto: int
    nombre: str

class DocumentoOut(BaseModel):
    id_documento: int
    nombre: str
    archivo_url: str
    
    class Config:
        from_attributes = True


# --- Schema para el Token ---
class Token(BaseModel):
    access_token: str
    token_type: str
class TokenData(BaseModel):
    email: Optional[str] = None