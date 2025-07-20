// frontend/frontend/src/api/realApi.js

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("http://127.0.0.1:8000/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Ошибка при анализе изображения");
  }

  const data = await response.json();

  return {
    status: data.class_name,
    confidence: data.confidence,
    timestamp: new Date().toLocaleString(),
    imageId: data.image_id, // не imageUrl!
  };
}
