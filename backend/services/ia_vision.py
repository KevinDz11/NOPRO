import io
import os
import fitz  # PyMuPDF
import numpy as np
import base64
from PIL import Image, ImageDraw, ImageFont # Importante: ImageDraw y ImageFont
from ultralytics import YOLO
from google.cloud import vision
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "best.pt")

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

def consultar_google_vision(pil_image):
    try:
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        content = img_byte_arr.getvalue()
        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)
        response = client.logo_detection(image=image)
        logos = response.logo_annotations
        return [f"{logo.description} ({logo.score:.2f})" for logo in logos]
    except Exception as e:
        print(f"❌ Error Google Vision: {e}")
        return []

def analizar_imagen_pdf(ruta_pdf):
    resultados = {
        "yolo_detections": [],
        "google_detections": [],
        "image_base64": None, # Campo clave para la imagen
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

        # 3. Detección YOLO
        results = model(pil_image, verbose=False)

        # Filtro de mejor confianza
        if results and results[0].boxes:
            mejor_indice = {}
            for i, box in enumerate(results[0].boxes):
                cls_id = int(box.cls[0]) 
                conf = float(box.conf[0])
                if cls_id not in mejor_indice or conf > mejor_indice[cls_id][0]:
                    mejor_indice[cls_id] = (conf, i)
            
            indices = [item[1] for item in mejor_indice.values()]
            results[0].boxes = results[0].boxes[indices]

            # --- DIBUJAR CAJAS (Draw) ---
            draw = ImageDraw.Draw(pil_image)
            try:
                # Intentar cargar fuente estándar
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()

            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_id = int(box.cls[0])
                name = model.names[cls_id]
                conf = float(box.conf[0])
                label = f"{name} {conf:.1f}"

                # Rectángulo Rojo
                draw.rectangle([x1, y1, x2, y2], outline="red", width=6)
                
                # Fondo del texto para que se lea
                text_bbox = draw.textbbox((x1, y1), label, font=font)
                draw.rectangle([text_bbox[0], text_bbox[1]-5, text_bbox[2]+5, text_bbox[3]+5], fill="red")
                draw.text((x1, y1-5), label, fill="white", font=font)

        # 4. Extraer Nombres
        detected_classes = []
        if results and results[0].boxes:
            unique_indices = results[0].boxes.cls.unique()
            detected_classes = [model.names[int(idx)] for idx in unique_indices]
        resultados["yolo_detections"] = detected_classes

        # 5. Google Vision
        resultados["google_detections"] = consultar_google_vision(pil_image)

        # 6. --- REDIMENSIONAR Y CONVERTIR A BASE64 ---
        # IMPORTANTE: Reducir tamaño para evitar problemas de memoria en frontend
        try:
            base_width = 800
            if pil_image.width > base_width:
                w_percent = (base_width / float(pil_image.width))
                h_size = int((float(pil_image.height) * float(w_percent)))
                # Usar Resampling.LANCZOS si está disponible, sino BILINEAR
                resample_method = Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS
                pil_image = pil_image.resize((base_width, h_size), resample_method)

            buffered = io.BytesIO()
            pil_image.save(buffered, format="JPEG", quality=85)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            resultados["image_base64"] = img_str
            print("✅ Imagen convertida a Base64 exitosamente.")
        except Exception as img_err:
            print(f"⚠️ Error generando imagen Base64: {img_err}")

        return resultados

    except Exception as e:
        print(f"❌ Error en ia_vision: {e}")
        resultados["status"] = "error"
        resultados["error"] = str(e)
        return resultados