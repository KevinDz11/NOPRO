from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from .database import Base

class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    fecha_creacion = Column(TIMESTAMP)
    estado = Column(Boolean, default=True)

    productos = relationship("Producto", back_populates="cliente")
    documentos = relationship("Documento", back_populates="cliente")

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    nombre = Column(String(100), nullable=False)
    descripcion = Column(String(255))
    fecha_registro = Column(TIMESTAMP)

    cliente = relationship("Cliente", back_populates="productos")
    documentos = relationship("Documento", back_populates="producto")

class Documento(Base):
    __tablename__ = "documentos"

    id_documento = Column(Integer, primary_key=True, index=True)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    nombre = Column(String(150), nullable=False)
    archivo_url = Column(String(255))
    fecha_subida = Column(TIMESTAMP)

    cliente = relationship("Cliente", back_populates="documentos")
    producto = relationship("Producto", back_populates="documentos")
