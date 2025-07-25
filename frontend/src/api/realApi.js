// frontend/frontend/src/api/realApi.js

const API_BASE = process.env.REACT_APP_API_URL;

export async function analyzeImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/analyze`, {
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
