from sqlalchemy.orm import Session
from backend import models, schemas

# Clientes
def create_cliente(db: Session, cliente: schemas.ClienteCreate):
    db_cliente = models.Cliente(**cliente.dict())
    db.add(db_cliente)
    db.commit()
    db.refresh(db_cliente)
    return db_cliente

def get_clientes(db: Session):
    return db.query(models.Cliente).all()

def get_cliente(db: Session, cliente_id: int):
    return db.query(models.Cliente).filter(models.Cliente.id_cliente == cliente_id).first()

def delete_cliente(db: Session, cliente_id: int):
    cliente = get_cliente(db, cliente_id)
    if cliente:
        db.delete(cliente)
        db.commit()
    return cliente

# Productos
def create_producto(db: Session, producto: schemas.ProductoCreate):
    db_producto = models.Producto(**producto.dict())
    db.add(db_producto)
    db.commit()
    db.refresh(db_producto)
    return db_producto

def get_productos(db: Session):
    return db.query(models.Producto).all()

# Documentos
def create_documento(db: Session, documento: schemas.DocumentoCreate):
    db_doc = models.Documento(**documento.dict())
    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    return db_doc

def get_documentos(db: Session):
    return db.query(models.Documento).all()

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

def get_documentos(db: Session):
    return db.query(models.Documento).all()