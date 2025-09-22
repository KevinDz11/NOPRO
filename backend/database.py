from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from urllib.parse import quote_plus

password = quote_plus("080361")  # codifica caracteres especiales
DATABASE_URL = f"postgresql+psycopg2://postgres:{password}@localhost:5432/bd_nopro"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependencia para sesión
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
