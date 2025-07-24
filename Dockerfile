# Use lightweight Python base image
FROM python:3.13-rc-slim

# Set environment vars
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set workdir
WORKDIR /app

# Install dependencies
COPY backend/ /app/
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && rm -rf ~/.cache

# Run FastAPI with Uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
