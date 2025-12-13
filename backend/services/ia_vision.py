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

# ==========================================================
# MAPEO YOLO → NORMA OFICIAL
# ==========================================================

YOLO_A_NORMA = {
    # 🔴 ESPECÍFICOS PRIMERO
    "nom-nyce": "NMX-I-60950-1-NYCE-2015",
    "nyce": "NMX-I-60950-1-NYCE-2015",
    "ce": "NMX-I-60950-1-NYCE-2015",
    "ul": "NMX-I-60950-1-NYCE-2015",

    "doble aislamiento": "NMX-I-60950-1-NYCE-2015",
    "choque electr": "NMX-I-60950-1-NYCE-2015",
    "alto voltaje": "NMX-I-60950-1-NYCE-2015",

    # ♻️ RECICLADO
    "raee": "NOM-024-SCFI-2013",
    "reciclado": "NOM-024-SCFI-2013",

    # 🟢 GENÉRICO AL FINAL
    "nom (": "NOM-106-SCFI-2000",
}



# --- CONFIGURACIÓN DE COLORES ---
COLOR_MAP = {
    "Samsung": "#1d4ed8",
    "LG": "#c50f46",
    "Sony": "#000000",
    "Brand": "#1d4ed8",
    "NOM": "#16a34a",
    "NOM-CE": "#16a34a",
    "Energy Star": "#eab308",
    "UL": "#dc2626",
    "basura": "#f97316",
    "choque": "#dc2626",
    "choque electr": "#dc2626",
    "doble aislamiento": "#9333ea",
    "reciclaje": "#22c55e",
}

def get_color_for_label(label):
    for key, color in COLOR_MAP.items():
        if key.lower() in label.lower():
            return color

    random.seed(label)
    r = random.randint(50, 200)
    g = random.randint(50, 200)
    b = random.randint(50, 200)
    return f"#{r:02x}{g:02x}{b:02x}"


# ---------------------------
#    THRESHOLDS POR CLASE
# ---------------------------
THRESHOLDS = {
    "nom": 0.45,
    "nom-ce": 0.50,
    "nom-eac": 0.40,
    "nom-nyce": 0.45,
    "nom-ul": 0.30,
    "nom-ance": 0.55,
    "choque electr": 0.45,
    "doble aislamiento": 0.40,
    "cont. especial": 0.50,
    "alto voltaje": 0.20,
}

# ---------------------------
#      Cargar Modelo YOLO
# ---------------------------
try:
    print(f"🔄 Intentando cargar modelo desde: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print("✅ Modelo 'best.pt' cargado exitosamente.")
except Exception as e:
    print(f"⚠️ Error cargando 'best.pt', usando fallback: {e}")
    model = YOLO("yolov8n.pt")


# ---------------------------
#    Google Vision Logos
# ---------------------------
def consultar_google_vision_avanzado(pil_image):
    detecciones = []
    nombres_simples = []

    try:
        img_byte_arr = io.BytesIO()
        pil_image.save(img_byte_arr, format='PNG')
        content = img_byte_arr.getvalue()

        client = vision.ImageAnnotatorClient()
        image = vision.Image(content=content)

        response = client.logo_detection(image=image)

        for logo in response.logo_annotations:
            desc = logo.description
            score = logo.score

            vertices = logo.bounding_poly.vertices
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
        print(f"⚠️ Error Google Vision: {e}")
        return [], []


# ---------------------------
#    APLICAR UMBRAL POR CLASE
# ---------------------------
def pasa_threshold(label, score):
    # Si la clase está configurada
    for key in THRESHOLDS:
        if key.lower() in label.lower():
            return score >= THRESHOLDS[key]

    # Si la clase no está en el diccionario, usar 0.45 por defecto
    return score >= 0.45


# ---------------------------
#      ANALIZAR PDF
# ---------------------------
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
        page = doc.load_page(0)
        pix = page.get_pixmap(dpi=200)
        doc.close()

        # 2. Convertir a PIL
        if pix.alpha:
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 4))
            pil_image = Image.fromarray(img[:, :, :3], 'RGB')
        else:
            img = np.frombuffer(pix.samples, dtype=np.uint8).reshape((pix.height, pix.width, 3))
            pil_image = Image.fromarray(img, 'RGB')

        objetos_a_dibujar = []

        # -------------------------------
        # 3. YOLO - DETECCIÓN INTERNA
        # -------------------------------
        results = model(pil_image, conf=0.10, verbose=False)  # conf bajo para permitir thresholds por clase
        yolo_nombres = []

        if results and results[0].boxes:
            for box in results[0].boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                cls_id = int(box.cls[0])
                label = model.names[cls_id]
                score = float(box.conf[0])

                # ✔ Aplicar threshold específico por clase
                if not pasa_threshold(label, score):
                    continue

                yolo_nombres.append(f"{label} ({score:.2f})")

                objetos_a_dibujar.append({
                    "label": label,
                    "score": score,
                    "box": [x1, y1, x2, y2],
                    "source": "YOLO"
                })

        resultados["yolo_detections"] = yolo_nombres
        # 🧠 MAPEAR DETECCIONES YOLO → NORMAS
        resultados["normas_detectadas"] = normalizar_detecciones_yolo(yolo_nombres)


        # -------------------------------
        # 4. GOOGLE VISION
        # -------------------------------
        google_objs, google_nombres = consultar_google_vision_avanzado(pil_image)
        objetos_a_dibujar.extend(google_objs)
        resultados["google_detections"] = google_nombres

        # -------------------------------
        # 5. DIBUJAR TODAS LAS CAJAS
        # -------------------------------
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

            draw.rectangle(box, outline=color, width=5)
            text = f"{label} {score:.2f}"

            text_bbox = draw.textbbox((box[0], box[1]), text, font=font)
            text_y = box[1] - 35 if box[1] > 35 else box[1]

            draw.rectangle([text_bbox[0]-5, text_y, text_bbox[2]+5, text_y+35], fill=color)
            draw.text((text_bbox[0], text_y), text, fill="white", font=font)

        # -------------------------------
        # 6. Base64 Output
        # -------------------------------
        base_width = 800
        if pil_image.width > base_width:
            w_percent = (base_width / float(pil_image.width))
            h_size = int(pil_image.height * w_percent)
            pil_image = pil_image.resize((base_width, h_size), Image.LANCZOS)

        buffered = io.BytesIO()
        pil_image.save(buffered, format="JPEG", quality=85)
        resultados["image_base64"] = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return resultados

    except Exception as e:
        print(f"❌ Error en ia_vision: {e}")
        resultados["status"] = "error"
        resultados["error"] = str(e)
        return resultados
    
def normalizar_detecciones_yolo(yolo_nombres):
    """
    Convierte:
    ["nom (0.93)", "nom-nyce (0.86)"]
    en:
    ["NOM", "NOM-NYCE"]
    """
    normas = set()

    for item in yolo_nombres:
        label = item.lower()

        if "nom-nyce" in label or "nyce" in label:
            normas.add("NOM-NYCE")
        elif "nom" in label:
            normas.add("NOM")

    return list(normas)