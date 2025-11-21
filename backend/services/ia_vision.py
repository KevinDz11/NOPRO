import io
import os
import fitz  # PyMuPDF
import numpy as np
from PIL import Image
from ultralytics import YOLO
from google.cloud import vision
from dotenv import load_dotenv

# 1. Cargar variables
load_dotenv()

# 2. Rutas Dinámicas (Para que funcione en cualquier PC)
BASE_DIR = os.path.dirname(os.path.dirname(__file__)) # backend/
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")

# 3. Configurar Credenciales Google (Robusto)
json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if json_path:
    # Si la ruta no es absoluta, intentamos encontrarla en backend/
    if not os.path.isabs(json_path):
        possible_path = os.path.join(BASE_DIR, os.path.basename(json_path))
        if os.path.exists(possible_path):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = possible_path
        else:
            # Fallback: intentar desde la raíz del proyecto
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(json_path)
else:
    print("⚠️ ADVERTENCIA: No hay credenciales de Google en .env")

# 4. Cargar Modelo
try:
    print(f"🔄 Intentando cargar modelo desde: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("✅ Modelo 'best.pt' cargado exitosamente.")
except Exception as e:
    print(f"⚠️ Error cargando 'best.pt', usando modelo de prueba: {e}")
    model = YOLO("yolov8n.pt")

# --- TU FUNCIÓN DE GOOGLE (IDÉNTICA A MAIN.PY) ---
def consultar_google_vision(pil_image):
    try:
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        content = img_byte_arr.getvalue()

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)

        response = client.logo_detection(image=image)
        logos = response.logo_annotations

        nombres_logos = []
        for logo in logos:
            nombres_logos.append(f"{logo.description} ({logo.score:.2f})")
            
        return nombres_logos 

    except Exception as e:
        print(f"❌ Error conectando con Google Vision: {e}")
        return []

# --- FUNCIÓN PRINCIPAL ADAPTADA ---
def analizar_imagen_pdf(ruta_pdf):
    """
    Extrae imagen del PDF, aplica filtro YOLO y consulta Google.
    """
    resultados = {
        "yolo_detections": [],
        "google_detections": [],
        "status": "success"
    }

    try:
        print(f"📸 Procesando imagen del PDF: {os.path.basename(ruta_pdf)}")
        
        # 1. Leer PDF (fitz)
        doc = fitz.open(ruta_pdf)
        if len(doc) < 1: return resultados
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=300)
        doc.close()
        
        # 2. Convertir a PIL (Tu lógica exacta)
        if pix.alpha:
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 4))
            pil_image = Image.fromarray(img_data[:, :, :3], 'RGB')
        else:
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 3))
            pil_image = Image.fromarray(img_data, 'RGB')

        # 3. YOLO
        results = model(pil_image, verbose=False)

        # --- TU FILTRO DE CAJAS (COPIADO DE MAIN.PY) ---
        if results and results[0].boxes:
            mejor_indice_por_clase = {}
            for i, box in enumerate(results[0].boxes):
                cls_id = int(box.cls[0]) 
                conf = float(box.conf[0])
                
                if cls_id not in mejor_indice_por_clase:
                    mejor_indice_por_clase[cls_id] = (conf, i)
                else:
                    conf_guardada = mejor_indice_por_clase[cls_id][0]
                    if conf > conf_guardada:
                        mejor_indice_por_clase[cls_id] = (conf, i)
            
            indices_finales = [item[1] for item in mejor_indice_por_clase.values()]
            results[0].boxes = results[0].boxes[indices_finales]
        # -----------------------------------------------

        # 4. Extraer nombres
        detected_classes_yolo = []
        if results and results[0].boxes:
            unique_class_indices = results[0].boxes.cls.unique()
            detected_classes_yolo = [model.names[int(cls_idx)] for cls_idx in unique_class_indices]

        resultados["yolo_detections"] = detected_classes_yolo
        print(f"🤖 YOLO detectó (interno): {detected_classes_yolo}")

        # 5. Google Vision
        print("☁️ Consultando Google Cloud Vision...")
        resultados["google_detections"] = consultar_google_vision(pil_image)
        print(f"☁️ Google detectó (interno): {resultados['google_detections']}")

        return resultados

    except Exception as e:
        print(f"❌ Error grave en ia_vision: {e}")
        resultados["status"] = "error"
        resultados["error"] = str(e)
        return resultados