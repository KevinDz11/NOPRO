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

# --- CONFIGURACIÓN DE COLORES ---
# Define colores específicos para clases conocidas.
# El formato es HEX string.
COLOR_MAP = {
    # Marcas
    "Samsung": "#1d4ed8",  # Azul fuerte
    "LG": "#c50f46",       # Rojo oscuro
    "Sony": "#000000",     # Negro
    "Brand": "#1d4ed8",
    
    # Normativas
    "NOM": "#16a34a",      # Verde
    "NOM-CE": "#16a34a",
    "Energy Star": "#eab308", # Amarillo
    "UL": "#dc2626",       # Rojo
    
    # Advertencias / Simbolos
    "basura": "#f97316",   # Naranja
    "choque": "#dc2626",   # Rojo
    "choque electr": "#dc2626",
    "doble aislamiento": "#9333ea", # Morado
    "reciclaje": "#22c55e", # Verde claro
}

def get_color_for_label(label):
    """Devuelve un color específico o uno aleatorio basado en el nombre."""
    # 1. Buscar coincidencia en el mapa
    for key, color in COLOR_MAP.items():
        if key.lower() in label.lower():
            return color
    
    # 2. Si no existe, generar color aleatorio consistente (hash)
    random.seed(label)
    r = random.randint(50, 200)
    g = random.randint(50, 200)
    b = random.randint(50, 200)
    return f"#{r:02x}{g:02x}{b:02x}"

# Configurar Credenciales
json_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if json_path:
    if not os.path.isabs(json_path):
        possible_path = os.path.join(BASE_DIR, os.path.basename(json_path))
        if os.path.exists(possible_path):
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = possible_path
        else:
            os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.abspath(json_path)

# Cargar Modelo
try:
    print(f"🔄 Intentando cargar modelo desde: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("✅ Modelo 'best.pt' cargado exitosamente.")
except Exception as e:
    print(f"⚠️ Error cargando 'best.pt', usando fallback: {e}")
    model = YOLO("yolov8n.pt")

def consultar_google_vision_avanzado(pil_image):
    """
    Retorna tanto descripciones como COORDENADAS (bounding poly)
    para poder dibujar las cajas de los logos detectados por Google.
    """
    detecciones = [] # Lista de dicts: {label, score, box: [x1, y1, x2, y2]}
    nombres_simples = []

    try:
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        content = img_byte_arr.getvalue()
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        
        # Usamos logo_detection
        response = client.logo_detection(image=image)
        
        for logo in response.logo_annotations:
            desc = logo.description
            score = logo.score
            
            # Obtener vértices para la caja
            vertices = logo.bounding_poly.vertices
            
            # Si hay vértices, calculamos la caja bounding (min/max)
            if vertices:
                x_coords = [v.x for v in vertices]
                y_coords = [v.y for v in vertices]
                x1, y1 = min(x_coords), min(y_coords)
                x2, y2 = max(x_coords), max(y_coords)
                
                detecciones.append({
                    "label": desc,
                    "score": score,
                    "box": [x1, y1, x2, y2],
                    "source": "Google"
                })
            
            nombres_simples.append(f"{desc} ({score:.2f})")
            
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
        if pix.alpha:
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 4))
            pil_image = Image.fromarray(img_data[:, :, :3], 'RGB')
        else:
            img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 3))
            pil_image = Image.fromarray(img_data, 'RGB')

        # Lista maestra de objetos a dibujar
        objetos_a_dibujar = []

        # 3. Detección YOLO (Interna)
        results = model(pil_image, verbose=False)
        yolo_nombres = []
        
        if results and results[0].boxes:
            # Filtrar por mejor confianza
            mejor_indice = {}
            for i, box in enumerate(results[0].boxes):
                cls_id = int(box.cls[0]) 
                conf = float(box.conf[0])
                if cls_id not in mejor_indice or conf > mejor_indice[cls_id][0]:
                    mejor_indice[cls_id] = (conf, i)
            
            indices = [item[1] for item in mejor_indice.values()]
            boxes_filtradas = results[0].boxes[indices]

            for box in boxes_filtradas:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_id = int(box.cls[0])
                name = model.names[cls_id]
                conf = float(box.conf[0])
                
                yolo_nombres.append(name)
                objetos_a_dibujar.append({
                    "label": name,
                    "score": conf,
                    "box": [x1, y1, x2, y2],
                    "source": "YOLO"
                })
        
        resultados["yolo_detections"] = yolo_nombres

        # 4. Detección Google (Nube) - Ahora con coordenadas
        google_objs, google_nombres = consultar_google_vision_avanzado(pil_image)
        objetos_a_dibujar.extend(google_objs) # Agregamos los logos de Google a la lista de dibujo
        resultados["google_detections"] = google_nombres

        # 5. DIBUJAR TODO (YOLO + GOOGLE)
        draw = ImageDraw.Draw(pil_image)
        try:
            font = ImageFont.truetype("arial.ttf", 30)
        except:
            font = ImageFont.load_default()

        for obj in objetos_a_dibujar:
            label = obj["label"]
            score = obj["score"]
            box = obj["box"] # [x1, y1, x2, y2]
            
            # Obtener color dinámico
            color = get_color_for_label(label)
            
            # Dibujar Caja
            draw.rectangle(box, outline=color, width=5)
            
            # Dibujar Etiqueta
            text = f"{label} {score:.2f}"
            
            # Fondo del texto (Mismo color que la caja)
            text_bbox = draw.textbbox((box[0], box[1]), text, font=font)
            # Ajustar posición si se sale de la imagen arriba
            text_y = box[1] - 35 if box[1] > 35 else box[1]
            
            draw.rectangle(
                [text_bbox[0]-5, text_y, text_bbox[2]+5, text_y+35], 
                fill=color
            )
            draw.text((text_bbox[0], text_y), text, fill="white", font=font)

        # 6. Redimensionar y Base64
        try:
            base_width = 800
            if pil_image.width > base_width:
                w_percent = (base_width / float(pil_image.width))
                h_size = int((float(pil_image.height) * float(w_percent)))
                resample_method = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
                pil_image = pil_image.resize((base_width, h_size), resample_method)

            buffered = io.BytesIO()
            pil_image.save(buffered, format="JPEG", quality=85)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            resultados["image_base64"] = img_str
            print("✅ Imagen Base64 generada con cajas multicolor.")
        except Exception as img_err:
            print(f"⚠️ Error generando imagen: {img_err}")

        return resultados

    except Exception as e:
        print(f"❌ Error en ia_vision: {e}")
        resultados["status"] = "error"
        resultados["error"] = str(e)
        return resultados