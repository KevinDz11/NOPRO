import io
import os
import fitz  # PyMuPDF
import numpy as np
import base64
import random
from PIL import Image, ImageDraw, ImageFont
from ultralytics import YOLO
from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")

# --- VARIABLE GLOBAL PARA LAZY LOADING ---
_model_instance = None

def get_model():
    """Carga el modelo YOLO solo cuando se necesita."""
    global _model_instance
    if _model_instance is None:
        try:
            print(f"🔄 Intentando cargar modelo desde: {MODEL_PATH}")
            _model_instance = YOLO(MODEL_PATH)
            print("✅ Modelo 'best.pt' cargado exitosamente.")
        except Exception as e:
            print(f"⚠️ Error cargando 'best.pt', usando fallback: {e}")
            _model_instance = YOLO("yolov8n.pt")
    return _model_instance

# --- CONFIGURACIÓN DE COLORES ---
COLOR_MAP = {
    "Samsung": "#1d4ed8", "LG": "#c50f46", "Sony": "#000000", "Brand": "#1d4ed8",
    "NOM": "#16a34a", "NOM-CE": "#16a34a", "Energy Star": "#eab308", "UL": "#dc2626",
    "basura": "#f97316", "choque": "#dc2626", "choque electr": "#dc2626",
    "doble aislamiento": "#9333ea", "reciclaje": "#22c55e",
}

def get_color_for_label(label):
    """Devuelve un color específico o uno aleatorio basado en el nombre."""
    for key, color in COLOR_MAP.items():
        if key.lower() in label.lower():
            return color
    random.seed(label)
    return f"#{random.randint(50, 200):02x}{random.randint(50, 200):02x}{random.randint(50, 200):02x}"

# Configurar Credenciales Google si existen
json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if json_path and not os.path.isabs(json_path):
    possible_path = os.path.join(BASE_DIR, os.path.basename(json_path))
    if os.path.exists(possible_path):
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = possible_path

def consultar_google_vision_avanzado(pil_image):
    detecciones = []
    nombres_simples = []
    try:
        # Si no hay credenciales, saltamos para evitar error
        if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
            # Opcional: imprimir warning solo una vez
            return [], []

        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        content = img_byte_arr.getvalue()
        
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        response = client.logo_detection(image=image)
        
        for logo in response.logo_annotations:
            vertices = logo.bounding_poly.vertices
            if vertices:
                x_coords = [v.x for v in vertices]
                y_coords = [v.y for v in vertices]
                detecciones.append({
                    "label": logo.description,
                    "score": logo.score,
                    "box": [min(x_coords), min(y_coords), max(x_coords), max(y_coords)],
                    "source": "Google"
                })
            nombres_simples.append(f"{logo.description} ({logo.score:.2f})")
            
        return detecciones, nombres_simples
    except Exception as e:
        print(f"❌ Error Google Vision: {e}")
        return [], []

def analizar_imagen_pdf(ruta_pdf):
    resultados = {
        "yolo_detections": [],
        "google_detections": [],
        "image_base64": None,
        "status": "success"
    }

    try:
        print(f"📸 Procesando imagen del PDF: {os.path.basename(ruta_pdf)}")
        
        # 1. Leer PDF
        doc = fitz.open(ruta_pdf)
        if len(doc) < 1: return resultados
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=200) 
        doc.close()
        
        # 2. Convertir a PIL
        mode = "RGBA" if pix.alpha else "RGB"
        img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, len(mode)))
        pil_image = Image.fromarray(img_data, mode).convert("RGB")

        objetos_a_dibujar = []

        # 3. Detección YOLO (USANDO LAZY LOADING)
        model = get_model() # <--- Aquí se carga el modelo
        results = model(pil_image, verbose=False)
        yolo_nombres = []
        
        if results and results[0].boxes:
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_id = int(box.cls[0])
                name = model.names[cls_id]
                conf = float(box.conf[0])
                
                # Filtro simple de confianza
                if conf > 0.4:
                    yolo_nombres.append(name)
                    objetos_a_dibujar.append({
                        "label": name,
                        "score": conf,
                        "box": [x1, y1, x2, y2],
                        "source": "YOLO"
                    })
        
        resultados["yolo_detections"] = yolo_nombres

        # 4. Detección Google
        google_objs, google_nombres = consultar_google_vision_avanzado(pil_image)
        objetos_a_dibujar.extend(google_objs)
        resultados["google_detections"] = google_nombres

        # 5. DIBUJAR TODO
        draw = ImageDraw.Draw(pil_image)
        try:
            font = ImageFont.truetype("arial.ttf", 30)
        except:
            font = ImageFont.load_default()

        for obj in objetos_a_dibujar:
            label = obj["label"]
            score = obj["score"]
            box = obj["box"]
            color = get_color_for_label(label)
            
            # Caja
            draw.rectangle(box, outline=color, width=5)
            
            # Etiqueta
            text = f"{label} {score:.2f}"
            bbox = draw.textbbox((box[0], box[1]), text, font=font)
            text_y = box[1] - 35 if box[1] > 35 else box[1]
            
            draw.rectangle([bbox[0]-5, text_y, bbox[2]+5, text_y+35], fill=color)
            draw.text((bbox[0], text_y), text, fill="white", font=font)

        # 6. Base64
        buffered = io.BytesIO()
        pil_image.save(buffered, format="JPEG", quality=85)
        img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        resultados["image_base64"] = img_str

        return resultados

    except Exception as e:
        print(f"❌ Error en ia_vision: {e}")
        resultados["status"] = "error"
        resultados["error"] = str(e)
        return resultados