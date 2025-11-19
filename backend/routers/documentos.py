import os
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
from ..services import ia_analisis

router = APIRouter(prefix="/documentos", tags=["Documentos"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/subir-analizar", response_model=schemas.DocumentoAnalisisOut)
def subir_y_analizar(
    id_producto: int = Form(...),
    nombre: str = Form(...),
    tipo: str = Form(...),      # Recibe "ficha" o "manual"
    categoria: str = Form(...), # Recibe "Laptop", "SmartTV", "Luminaria"
    archivo: UploadFile = File(...),
    analizar: bool = Form(True),
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    try:
        # 1. Obtener ID del cliente desde el token (Seguridad)
        id_cliente = current_user.id_cliente

        # 2. Guardar el archivo físicamente en el servidor
        file_path = os.path.join(UPLOAD_DIR, archivo.filename)
        with open(file_path, "wb") as f:
            f.write(archivo.file.read())

        # 3. Registrar el documento en la Base de Datos
        documento_data = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )
        # create_documento guarda la URL/Path y retorna el objeto guardado
        doc_db = crud.create_documento(db, documento_data, archivo_url=file_path)

        # 4. EJECUTAR ANÁLISIS DE IA (Si se solicitó y es PDF)
        resultados_ia = []
        if analizar and archivo.filename.lower().endswith(".pdf"):
            
            # --- A. Normalizar Categoría ---
            # El frontend puede mandar "smarttv", "SmartTV", "Smart Tv", etc.
            # Lo estandarizamos a las llaves exactas de tu diccionario en ia_analisis.py
            cat_map = {
                "laptop": "Laptop",
                "smarttv": "SmartTV",
                "smart tv": "SmartTV",
                "tv": "SmartTV",
                "luminaria": "Luminaria",
                "iluminacion": "Luminaria"
            }
            # Si no encuentra la categoría, usa "Laptop" por defecto para no fallar
            categoria_clean = cat_map.get(categoria.lower(), "Laptop")

            # --- B. Normalizar Tipo ---
            # El frontend manda "ficha" o "manual", el backend espera "Ficha" o "Manual"
            tipo_clean = "Ficha" if tipo.lower() == "ficha" else "Manual"

            # --- C. Llamar al Cerebro Maestro ---
            print(f"🧠 Iniciando análisis IA: {categoria_clean} - {tipo_clean}")
            resultados_ia = ia_analisis.analizar_documento(file_path, tipo_clean, categoria_clean)

        # 5. Retornar la respuesta combinada (Datos BD + Resultados IA)
        return {
            "id_documento": doc_db.id_documento,
            "nombre": doc_db.nombre,
            "archivo_url": doc_db.archivo_url,
            "analisis_ia": resultados_ia
        }

    except Exception as e:
        print(f"Error en subir_y_analizar: {e}")
        raise HTTPException(status_code=500, detail=f"Error al procesar documento: {str(e)}")

@router.get("/", response_model=list[schemas.DocumentoOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)
