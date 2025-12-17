from sqlalchemy.orm import Session
from backend import models, schemas, database
import random
from datetime import datetime

#Obtiene un cliente por su ID.
def get_cliente(db: Session, cliente_id: int):
    return db.query(models.Cliente).filter(models.Cliente.id_cliente == cliente_id).first()

#Obtiene un cliente por su email.
def get_cliente_by_email(db: Session, email: str):
    return db.query(models.Cliente).filter(models.Cliente.email == email).first()

#Obtiene una lista de todos los clientes.
def get_clientes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Cliente).offset(skip).limit(limit).all()

#Crea un nuevo cliente con la contraseña encriptada y un código de verificación.
def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    from . import auth 
    
    hashed_password = auth.get_password_hash(cliente.contrasena)
    verification_code = str(random.randint(100000, 999999))
    
    db_cliente = models.Cliente(
        email=cliente.email, 
        nombre=cliente.nombre, 
        contrasena=hashed_password,
        verification_code=verification_code #Guardar el código
    )
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente


#Elimina un cliente forzando primero la eliminación de todos sus documentos y productos asociados para evitar errores de llave foránea.
def delete_cliente(db: Session, cliente_id: int):
    cliente = get_cliente(db, cliente_id)
    if not cliente:
        return None

    try:
        #BORRADO DE DOCUMENTOS
        #Primero se borran los documentos vinculados directamente al cliente
        db.query(models.Documento).filter(models.Documento.id_cliente == cliente_id).delete(synchronize_session=False)
        
        # Luego se buscan los productos del cliente para borrar documentos que estén vinculados al producto
        # (Esto previene errores si un documento quedó huérfano de id_cliente pero tiene id_producto)
        productos = db.query(models.Producto).filter(models.Producto.id_cliente == cliente_id).all()
        producto_ids = [p.id_producto for p in productos]
        
        if producto_ids:
            db.query(models.Documento).filter(models.Documento.id_producto.in_(producto_ids)).delete(synchronize_session=False)

        #BORRADO DE PRODUCTOS
        #Una vez sin documentos estorbando, se borran los productos
        db.query(models.Producto).filter(models.Producto.id_cliente == cliente_id).delete(synchronize_session=False)

        #BORRADO DEL CLIENTE
        db.delete(cliente)
        
        #Confirmar cambios en la BD
        db.commit()
        
        return cliente

    except Exception as e:
        # Si algo falla, se deshace cualquier cambio parcial para no romper la BD
        db.rollback()
        print(f"ERROR CRÍTICO AL ELIMINAR CLIENTE {cliente_id}: {e}")
        # Se relanza el error para que el frontend se entere
        raise e

#Guarda el token de reseteo y su expiración en la BD.
def set_reset_token(db: Session, user: models.Cliente, token: str, expires: datetime):
    user.reset_token = token
    user.reset_token_expires = expires
    db.commit()
    db.refresh(user)
    return user

#Busca un usuario por su token de reseteo.
def get_user_by_reset_token(db: Session, token: str):
    return db.query(models.Cliente).filter(models.Cliente.reset_token == token).first()

#Actualiza la contraseña y limpia los campos de reseteo.
def update_password_and_clear_token(db: Session, user: models.Cliente, new_hashed_password: str):
    user.contrasena = new_hashed_password
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    return user


#Productos
def get_productos(db: Session, skip: int = 0, limit: int = 100):
    productos = db.query(models.Producto).offset(skip).limit(limit).all()

    for p in productos:
        if p.documentos:
            for d in p.documentos:
                if d.analisis_ia is None:
                    d.analisis_ia = []
    return productos


def get_productos_by_cliente(db: Session, cliente_id: int, skip: int = 0, limit: int = 100):
    productos = (
        db.query(models.Producto)
        .filter(models.Producto.id_cliente == cliente_id)
        .offset(skip)
        .limit(limit)
        .all()
    )

    for p in productos:
        if p.documentos:
            for d in p.documentos:
                if d.analisis_ia is None:
                    d.analisis_ia = [] 
    return productos

#Crea un nuevo producto asociado a un cliente.
def create_producto(db: Session, producto: schemas.ProductoCreate, cliente_id: int):
    db_producto = models.Producto(**producto.dict(), id_cliente=cliente_id)
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto

#Documentos
#Obtiene una lista de todos los documentos.
def get_documentos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Documento).offset(skip).limit(limit).all()

#Crea un nuevo documento con la URL del archivo.
def create_documento(db: Session, documento: schemas.DocumentoCreate, archivo_url: str):
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

#Guarda los resultados del análisis de IA en la base de datos para que estén disponibles en el historial.
def update_documento_analisis(db: Session, documento_id: int, analisis_resultados: list):
    #Se busca en el documento
    db_doc = db.query(models.Documento).filter(models.Documento.id_documento == documento_id).first()
    
    if db_doc:
        #Se guardan los datos (SQLAlchemy maneja la conversión a JSON automáticamente)
        db_doc.analisis_ia = analisis_resultados
        db.commit()
        db.refresh(db_doc)
        
    return db_doc