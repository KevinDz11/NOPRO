# Usamos Python 3.11
FROM python:3.11-slim-bookworm

# 1. Instalar dependencias del sistema necesarias para OpenCV y compilación
RUN apt-get update && apt-get install -y \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgl1 \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Instalar PyTorch CPU primero (para reducir tamaño de imagen)
RUN pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# 3. Copiar requirements e instalar
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Descargar modelo de Spacy
RUN python -m spacy download es_core_news_md

# 5. Copiar el código
# Asumimos que construyes la imagen desde la raíz del proyecto
COPY backend ./backend

# 6. Crear directorio de uploads y dar permisos (Importante para Azure)
RUN mkdir -p /app/backend/uploads
RUN chmod -R 777 /app/backend/uploads

EXPOSE 8000

# Usamos la ruta absoluta del módulo
CMD ["sh", "-c", "uvicorn backend.index:app --host 0.0.0.0 --port ${PORT:-8000}"]
