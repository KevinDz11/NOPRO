import os
import shutil  # <--- IMPORTANTE: Necesario para guardar sin saturar la RAM
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from .. import crud, schemas, database, auth, models
# IMPORTANTE: Asegúrate de importar pdf_report
from ..services import ia_analisis, pdf_report 
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/documentos", tags=["Documentos"])

# Configuración robusta de la ruta para Render
# Esto asegura que la carpeta 'uploads' esté dentro de 'backend' sin importar desde dónde se ejecute
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) # Sube un nivel desde 'routers' a 'backend'
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Schema para el reporte general
class ReporteGeneralRequest(BaseModel):
    ids_documentos: List[int]

@router.post("/subir-analizar", response_model=schemas.DocumentoAnalisisOut)
def subir_y_analizar(
    id_producto: int = Form(...),
    nombre: str = Form(...),
    tipo: str = Form(...),
    categoria: str = Form(...), 
    marca: str = Form(""), 
    archivo: UploadFile = File(...),
    analizar: bool = Form(True),
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    try:
        # 1. Crear directorio si no existe (Vital para Render/Sistemas Efímeros)
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR, exist_ok=True)
            print(f"Directorio creado en: {UPLOAD_DIR}")

        id_cliente = current_user.id_cliente
        
        # Limpiar el nombre del archivo para evitar errores de ruta
        filename_clean = os.path.basename(archivo.filename)
        file_path = os.path.join(UPLOAD_DIR, filename_clean)
        
        # 2. GUARDAR USANDO SHUTIL (Esto evita el error de conexión por memoria llena)
        # En lugar de leer todo a la RAM con archivo.file.read(), lo copiamos directo al disco.
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
            
        print(f"Archivo guardado exitosamente en: {file_path}")

        documento_data = schemas.DocumentoCreate(
            id_cliente=id_cliente,
            id_producto=id_producto,
            nombre=nombre
        )
        # Guardar referencia en DB
        doc_db = crud.create_documento(db, documento_data, archivo_url=file_path)

        resultados_ia = []
        # Verificar que el archivo realmente existe antes de enviarlo a la IA
        if analizar and archivo.filename.lower().endswith(".pdf") and os.path.exists(file_path):
            cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
            categoria_clean = cat_map.get(categoria.lower(), "Laptop")

            tipo_clean = "Ficha"
            if "manual" in tipo.lower(): tipo_clean = "Manual"
            elif "etiqueta" in tipo.lower(): tipo_clean = "Etiqueta"

            print(f"Analizando: {categoria_clean} - {tipo_clean}...")
            
            try:
                resultados_ia = ia_analisis.analizar_documento(
                    file_path, tipo_clean, categoria_clean, marca_esperada=marca
                )

                if resultados_ia:
                    crud.update_documento_analisis(db, doc_db.id_documento, resultados_ia)
                    doc_db.analisis_ia = resultados_ia
            except Exception as ia_error:
                print(f"Error durante el análisis de IA (pero el archivo se subió): {ia_error}")
                # No lanzamos error para no cancelar la subida, pero podrías manejarlo según tu lógica

        return doc_db

    except Exception as e:
        print(f"Error CRÍTICO subiendo archivo: {e}")
        import traceback
        traceback.print_exc() # Imprimir el error completo en los logs de Render
        raise HTTPException(status_code=500, detail=f"Error al procesar el archivo: {str(e)}")

# --- ENDPOINT LISTAR ---
@router.get("/", response_model=list[schemas.DocumentoAnalisisOut])
def listar_documentos(db: Session = Depends(database.get_db)):
    return crud.get_documentos(db)

# --- REPORTE INDIVIDUAL ---
@router.get("/{id_documento}/reporte-pdf")
def descargar_reporte_pdf(
    id_documento: int,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    db_doc = db.query(models.Documento).filter(models.Documento.id_documento == id_documento).first()
    if not db_doc:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if db_doc.id_cliente != current_user.id_cliente:
        raise HTTPException(status_code=403, detail="No autorizado")

    if not db_doc.analisis_ia:
        raise HTTPException(status_code=400, detail="Este documento no ha sido analizado aún.")

    producto = db.query(models.Producto).filter(models.Producto.id_producto == db_doc.id_producto).first()
    
    categoria_prod = "Laptop"
    marca_prod = "Marca Desconocida"
    modelo_prod = "Modelo Desconocido"

    if producto:
        categoria_prod = producto.nombre 
        marca_prod = producto.marca if producto.marca else "Genérico"
        modelo_prod = producto.descripcion if producto.descripcion else "Sin Modelo"

    cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    tipo_clean = "Ficha"
    nombre_doc = db_doc.nombre.lower()
    if "manual" in nombre_doc:
        tipo_clean = "Manual"
    elif "etiqueta" in nombre_doc:
        tipo_clean = "Etiqueta"

    try:
        pdf_buffer = pdf_report.generar_pdf_reporte(
            documento_db=db_doc,
            resultados_ia=db_doc.analisis_ia,
            categoria_producto=categoria_clean,
            tipo_documento=tipo_clean,
            marca_producto=marca_prod,   
            modelo_producto=modelo_prod  
        )
        
        filename = f"Reporte_{marca_prod}_{tipo_clean}.pdf"
        filename = "".join([c for c in filename if c.isalnum() or c in (' ', '.', '_')]).strip()
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error generando el PDF: {str(e)}")

# --- REPORTE GENERAL ---
@router.post("/reporte-general-pdf")
def descargar_reporte_general_pdf(
    payload: ReporteGeneralRequest,
    db: Session = Depends(database.get_db),
    current_user: models.Cliente = Depends(auth.get_current_user)
):
    ids = payload.ids_documentos
    if not ids:
        raise HTTPException(status_code=400, detail="No se seleccionaron documentos para el reporte.")

    # Obtener documentos
    docs = db.query(models.Documento).filter(models.Documento.id_documento.in_(ids)).all()
    if not docs:
        raise HTTPException(status_code=404, detail="No se encontraron los documentos solicitados.")

    # Validación de seguridad: Pertenecen al usuario
    if any(d.id_cliente != current_user.id_cliente for d in docs):
         raise HTTPException(status_code=403, detail="No tiene permiso para acceder a uno o más documentos.")

    # Datos del producto (tomamos del primero para el encabezado global)
    first_doc = docs[0]
    producto = db.query(models.Producto).filter(models.Producto.id_producto == first_doc.id_producto).first()
    
    marca_prod = producto.marca if (producto and producto.marca) else "Marca no especificada"
    modelo_prod = producto.descripcion if (producto and producto.descripcion) else "Modelo no especificado"
    categoria_prod = producto.nombre if producto else "Laptop"
    
    # Mapa de categorías (Normalización)
    cat_map = {"laptop": "Laptop", "smarttv": "SmartTV", "smart tv": "SmartTV", "tv": "SmartTV", "luminaria": "Luminaria"}
    categoria_clean = cat_map.get(categoria_prod.lower(), "Laptop")

    # Preparar lista para el servicio PDF
    lista_para_pdf = []
    for d in docs:
        # Solo incluimos documentos que ya tengan análisis
        if d.analisis_ia: 
            lista_para_pdf.append({
                'doc': d,
                'resultados': d.analisis_ia
            })

    if not lista_para_pdf:
        raise HTTPException(status_code=400, detail="Ninguno de los documentos seleccionados ha sido analizado por la IA aún.")

    try:
        # Llamada a la función en pdf_report.py
        pdf_buffer = pdf_report.generar_pdf_reporte_general(
            lista_docs=lista_para_pdf,
            categoria_producto=categoria_clean,
            marca_producto=marca_prod,
            modelo_producto=modelo_prod
        )
        
        filename = f"Reporte_General_{marca_prod}.pdf"
        # Limpieza simple del nombre de archivo
        filename = "".join([c for c in filename if c.isalnum() or c in (' ', '.', '_', '-')]).strip()
        
        return StreamingResponse(
            pdf_buffer, 
            media_type="application/pdf", 
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        print(f"Error generando PDF General: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Ocurrió un error interno al generar el PDF unificado.")