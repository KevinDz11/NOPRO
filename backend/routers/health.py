from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.database import get_db

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "backend-nopro"
    }

@router.get("/health/db")
def health_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "postgresql",
            "connection": "healthy"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": "postgresql",
            "connection": "failed",
            "detail": str(e)
        }
