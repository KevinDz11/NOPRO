from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, TIMESTAMP
from sqlalchemy.orm import relationship
from .database import Base
from sqlalchemy.sql import func

class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    contrasena = Column(String(255), nullable=False)
    fecha_creacion = Column(TIMESTAMP, server_default=func.now())
    estado = Column(Boolean, default=False)
    verification_code = Column(String(10), nullable=True)
    reset_token = Column(String(255), unique=True, nullable=True, index=True)
    reset_token_expires = Column(TIMESTAMP(timezone=True), nullable=True)
    productos = relationship("Producto", back_populates="cliente")
    documentos = relationship("Documento", back_populates="cliente")

class Producto(Base):
    __tablename__ = "productos"

    id_producto = Column(Integer, primary_key=True, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    nombre = Column(String(100), nullable=False) # Tipo (Laptop, etc)
    marca = Column(String(100), nullable=True)   # <-- CAMBIO AÑADIDO
    descripcion = Column(String(255)) # Modelo
    # Valor por defecto para fecha_registro
    fecha_registro = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente", back_populates="productos")
    documentos = relationship("Documento", back_populates="producto")

class Documento(Base):
    __tablename__ = "documentos"

    id_documento = Column(Integer, primary_key=True, index=True)
    id_producto = Column(Integer, ForeignKey("productos.id_producto"))
    id_cliente = Column(Integer, ForeignKey("clientes.id_cliente"))
    nombre = Column(String(150), nullable=False)
    archivo_url = Column(String(255))
    fecha_subida = Column(TIMESTAMP, server_default=func.now())

    cliente = relationship("Cliente", back_populates="documentos")
    producto = relationship("Producto", back_populates="documentos")
