from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth

router = APIRouter(tags=["Auth"])

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(db: Session = Depends(database.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # Busca al usuario por su email (username en el formulario)
    user = crud.get_cliente_by_email(db, email=form_data.username)
    
    # Verifica si el usuario existe y la contraseña es correcta
    if not user or not auth.verify_password(form_data.password, user.contrasena):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crea el token de acceso
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "id": user.id_cliente}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}