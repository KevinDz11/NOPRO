from sqlalchemy.orm import Session
from . import models, schemas
import random
from datetime import datetime

def get_cliente(db: Session, cliente_id: int):
    """Obtiene un cliente por su ID."""
    return db.query(models.Cliente).filter(models.Cliente.id_cliente == cliente_id).first()

def get_cliente_by_email(db: Session, email: str):
    """Obtiene un cliente por su email."""
    return db.query(models.Cliente).filter(models.Cliente.email == email).first()

def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene una lista de todos los clientes."""
    return db.query(models.Cliente).offset(skip).limit(limit).all()

def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    """Crea un nuevo cliente con la contraseña encriptada y un código de verificación."""

    from . import auth 
    
    hashed_password = auth.get_password_hash(cliente.contrasena)
    verification_code = str(random.randint(100000, 999999))
    
    db_cliente = models.Cliente(
        email=cliente.email, 
        nombre=cliente.nombre, 
        contrasena=hashed_password,
        verification_code=verification_code # <-- Guardar el código
    )
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def delete_cliente(db: Session, cliente_id: int):
    """Elimina un cliente por su ID."""
    cliente = get_cliente(db, cliente_id)
    if cliente:
        db.delete(cliente)
        db.commit()
    return cliente

def set_reset_token(db: Session, user: models.Cliente, token: str, expires: datetime):
    """Guarda el token de reseteo y su expiración en la BD."""
    user.reset_token = token
    user.reset_token_expires = expires
    db.commit()
    db.refresh(user)
    return user

def get_user_by_reset_token(db: Session, token: str):
    """Busca un usuario por su token de reseteo."""
    return db.query(models.Cliente).filter(models.Cliente.reset_token == token).first()

def update_password_and_clear_token(db: Session, user: models.Cliente, new_hashed_password: str):
    """Actualiza la contraseña y limpia los campos de reseteo."""
    user.contrasena = new_hashed_password
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return user


# --- Productos ---

def get_productos(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene una lista de todos los productos."""
    return db.query(models.Producto).offset(skip).limit(limit).all()

def get_productos_by_cliente(db: Session, cliente_id: int, skip: int = 0, limit: int = 100):
    """Obtiene una lista de productos para un cliente específico."""
    return db.query(models.Producto)\
             .filter(models.Producto.id_cliente == cliente_id)\
             .offset(skip)\
             .limit(limit)\
             .all()

def create_producto(db: Session, producto: schemas.ProductoCreate, cliente_id: int):
    """Crea un nuevo producto asociado a un cliente."""
    db_producto = models.Producto(**producto.dict(), id_cliente=cliente_id)
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto

# --- Documentos ---

def get_documentos(db: Session, skip: int = 0, limit: int = 100):
    """Obtiene una lista de todos los documentos."""
    return db.query(models.Documento).offset(skip).limit(limit).all()

def create_documento(db: Session, documento: schemas.DocumentoCreate, archivo_url: str):
    """Crea un nuevo documento con la URL del archivo."""
    db_doc = models.Documento(
        id_cliente=documento.id_cliente,
        id_producto=documento.id_producto,
        nombre=documento.nombre,
        archivo_url=archivo_url
    )
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc