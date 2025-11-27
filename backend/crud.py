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
    """
    Elimina un cliente forzando primero la eliminación de todos sus
    documentos y productos asociados para evitar errores de llave foránea.
    """
    # 1. Obtenemos el cliente. Si no existe, retornamos None.
    cliente = get_cliente(db, cliente_id)
    if not cliente:
        return None

    try:
        # 2. BORRADO DE DOCUMENTOS (Limpieza profunda)
        # Primero borramos documentos vinculados directamente al cliente
        db.query(models.Documento).filter(models.Documento.id_cliente == cliente_id).delete(synchronize_session=False)
        
        # Luego buscamos los productos del cliente para borrar documentos que estén vinculados al producto
        # (Esto previene errores si un documento quedó huérfano de id_cliente pero tiene id_producto)
        productos = db.query(models.Producto).filter(models.Producto.id_cliente == cliente_id).all()
        producto_ids = [p.id_producto for p in productos]
        
        if producto_ids:
            db.query(models.Documento).filter(models.Documento.id_producto.in_(producto_ids)).delete(synchronize_session=False)

        # 3. BORRADO DE PRODUCTOS
        # Una vez sin documentos estorbando, borramos los productos
        db.query(models.Producto).filter(models.Producto.id_cliente == cliente_id).delete(synchronize_session=False)

        # 4. BORRADO DEL CLIENTE
        # Ahora que está "desnudo" (sin dependencias), lo borramos.
        db.delete(cliente)
        
        # 5. Confirmar cambios en la BD
        db.commit()
        
        return cliente

    except Exception as e:
        # Si algo falla, deshacemos cualquier cambio parcial para no romper la BD
        db.rollback()
        print(f"❌ ERROR CRÍTICO AL ELIMINAR CLIENTE {cliente_id}: {e}")
        # Relanzamos el error para que el frontend se entere
        raise e

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