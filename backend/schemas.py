from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

#SCHEMAS DE RESULTADOS IA Y DOCUMENTOS
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
    analisis_ia: List[Any] = []

    class Config:
        from_attributes = True


#SCHEMA DEL RESULTADO NORMATIVO
class ResultadoNormativoOut(BaseModel):
    norma: str
    nombre: str
    descripcion: Optional[str] = None
    estado: str
    documentos_aplicables: Optional[List[str]] = None
    evidencia_esperada: Optional[List[str]] = None
    score_confianza: Optional[float] = None

#DOCUMENTO CON ANÁLISIS + CHECKLIST
class DocumentoAnalisisOut(DocumentoOut):
    resultado_normativo: Optional[List[ResultadoNormativoOut]] = []

#SCHEMAS DE PRODUCTO
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
    documentos: List[DocumentoAnalisisOut] = []

    class Config:
        from_attributes = True


#SCHEMAS DE CLIENTE
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


#OTROS
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
    analisis_ia: Optional[List[Any]] = None

    class Config:
        from_attributes = True