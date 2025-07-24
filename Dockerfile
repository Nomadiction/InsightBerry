# Используем slim-версию Python
FROM python:3.13-rc-slim

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем код
COPY backend/ /app/

# Устанавливаем зависимости
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Указываем порт
ENV PORT=8080

# Запуск FastAPI-приложения
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
