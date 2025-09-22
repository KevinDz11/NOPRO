from pydantic import BaseModel
from typing import Optional

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
        orm_mode = True

# Producto
class ProductoBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None

class ProductoCreate(ProductoBase):
    id_cliente: int

class ProductoOut(BaseModel):
    id_producto: int
    nombre: str
    descripcion: Optional[str]
    class Config:
        orm_mode = True

# Documento
class DocumentoBase(BaseModel):
    nombre: str
    archivo_url: str

class DocumentoCreate(DocumentoBase):
    id_cliente: int
    id_producto: int

class DocumentoOut(BaseModel):
    id_documento: int
    nombre: str
    archivo_url: str
    class Config:
        orm_mode = True
