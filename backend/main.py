# backend/main.py

from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List
from PIL import Image
import io
import os
import shutil
import torch
from torchvision import transforms
from torchvision.models import resnet18
from datetime import datetime
from fastapi.responses import FileResponse
from fpdf import FPDF
import tempfile
from database import SessionLocal, engine
import models
from collections import Counter
import urllib.parse

# ─────────────────────────────
# 1. Настройки и инициализация
# ─────────────────────────────
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # В продакшене — ограничь
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статическая папка для изображений
UPLOAD_DIR = "images"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/history/image", StaticFiles(directory=UPLOAD_DIR), name="images")

# Загрузка модели
model = resnet18(weights=None, num_classes=4)
model.load_state_dict(torch.load("model_state.pt", map_location="cpu"))
model.eval()

# Классы
CLASSES = [
    "Здоровое растение",
    "Растение в состоянии стресса",
    "Признаки плесени",
    "Недостаток влаги (пересушено)"
]

# Трансформация для изображения
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor()
])

# ─────────────────────────────
# 2. Утилиты
# ─────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def log_prediction_db(db: Session, filename: str, result: dict):
    prediction = models.Prediction(
        filename=filename,
        result=result["class_name"],
        confidence=result["confidence"],
        timestamp=datetime.now()
    )
    db.add(prediction)
    db.commit()

# ─────────────────────────────
# 3. Эндпоинты
# ─────────────────────────────

# Анализ изображения
@app.post("/analyze")
async def analyze_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    contents = await file.read()

    # Сохраняем файл в /images
    filepath = os.path.join(UPLOAD_DIR, file.filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Анализ
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    image_tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(image_tensor)
        probs = torch.softmax(outputs, dim=1)
        confidence, class_idx = torch.max(probs, 1)

    result = {
        "class_index": class_idx.item(),
        "class_name": CLASSES[class_idx.item()],
        "confidence": round(confidence.item() * 100, 2)
    }

    # Запись в базу
    log_prediction_db(db, file.filename, result)

    return result

# История анализов
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(models.Prediction).order_by(models.Prediction.timestamp.desc()).all()
    return [
        {
            "imageId": r.filename,
            "status": r.result,
            "confidence": r.confidence,
            "timestamp": r.timestamp.isoformat(),
            "imageUrl": f"http://127.0.0.1:8000/history/image/{r.filename}"  
        }
        for r in records
    ]

# Удаление одного элемента истории
@app.delete("/history/{filename}")
def delete_record(filename: str, db: Session = Depends(get_db)):
    record = db.query(models.Prediction).filter(models.Prediction.filename == filename).first()
    if record:
        db.delete(record)
        db.commit()
    # также удалим файл
    try:
        os.remove(os.path.join(UPLOAD_DIR, filename))
    except FileNotFoundError:
        pass
    return {"success": True}

# Очистка всей истории
@app.delete("/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(models.Prediction).delete()
    db.commit()
    # удаляем все изображения
    for file in os.listdir(UPLOAD_DIR):
        try:
            os.remove(os.path.join(UPLOAD_DIR, file))
        except:
            pass
    return {"success": True}

# ─────────────────────────────
# 4. Экспорт истории
# ─────────────────────────────

@app.get("/history/export")
def export_history(db: Session = Depends(get_db)):
    records = db.query(models.Prediction).order_by(models.Prediction.timestamp.desc()).all()
    
    pdf = FPDF(orientation="P", unit="mm", format="A4")
    pdf.set_auto_page_break(auto=True, margin=15)

    font_path = os.path.abspath(os.path.join("fonts", "DejaVuSans.ttf"))
    if not os.path.exists(font_path):
        raise FileNotFoundError("Шрифт DejaVuSans.ttf не найден в папке /fonts")

    pdf.add_font("DejaVu", "", font_path, uni=True)
    pdf.set_font("DejaVu", size=12)

    # Заголовок
    pdf.add_page()
    pdf.set_font("DejaVu", size=18)
    pdf.set_text_color(30, 30, 30)
    pdf.cell(0, 15, "История анализов растений", ln=True, align="C")
    pdf.ln(8)

    stat_counter = Counter()

    # Записи
    for r in records:
        y_start = pdf.get_y()
        pdf.set_fill_color(245, 245, 245)
        pdf.set_draw_color(180, 180, 180)
        pdf.set_line_width(0.3)
        pdf.rect(10, y_start, 190, 50)

        img_path = os.path.join("images", r.filename)
        if os.path.exists(img_path):
            try:
                pdf.image(img_path, x=12, y=y_start + 2, w=46, h=46)
            except:
                pass

        pdf.set_xy(62, y_start + 4)
        pdf.set_font("DejaVu", size=12)
        pdf.set_text_color(0, 0, 0)
        pdf.multi_cell(0, 8,
            f"Файл: {r.filename}\n"
            f"Статус: {r.result}\n"
            f"Уверенность: {r.confidence:.2f}%\n"
            f"Дата/время: {r.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
        )

        pdf.ln(5)
        stat_counter[r.result] += 1

    # Итоговая статистика
    pdf.add_page()
    pdf.set_font("DejaVu", size=16)
    pdf.cell(0, 12, "Итоги анализа", ln=True)

    pdf.set_font("DejaVu", size=12)
    if not stat_counter:
        pdf.cell(0, 10, "Нет данных для анализа.", ln=True)
    else:
        total = sum(stat_counter.values())
        for cls, count in stat_counter.items():
            percent = (count / total) * 100
            pdf.cell(0, 8, f"• {cls}: {count} ({percent:.1f}%)", ln=True)

    # Сохраняем PDF
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        pdf.output(tmp_file.name)
        filename_ascii = "blueberry_report.pdf"
        filename_utf = "Анализ_голубики_отчет.pdf"
        content_disposition = (
            f'attachment; filename="{filename_ascii}"; filename*=UTF-8\'\'{urllib.parse.quote(filename_utf)}'
        )
        return FileResponse(
            tmp_file.name,
            filename=filename_ascii, 
            media_type="application/pdf",
            headers={
                "Content-Disposition": content_disposition,
                "Cache-Control": "no-cache"
            }
        )


