// frontend/src/components/ResultCard.jsx

import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export default function ResultCard({ result }) {
  if (!result || typeof result !== "object") return null;
  if (!result.status || !result.confidence || !result.timestamp) {
    return <div style={{color: "red"}}>Ошибка: не хватает данных для отображения результата.</div>;
  }

  console.log("ResultCard props", result);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="bg-white/90 dark:bg-gray-900/80 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-7 flex flex-col items-center"
    >
      <div className="flex items-center gap-2 mb-2">
        <CheckCircle2 className="text-green-400 w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Результат анализа</h3>
      </div>
      <p className="text-base text-gray-400 dark:text-gray-300 mb-1">
        Статус: <span className="font-semibold text-sky-400">{result.status}</span>
      </p>
      <p className="text-base text-gray-400 dark:text-gray-300 mb-1">
        Уверенность: <span className="font-bold text-gray-900 dark:text-white">{result.confidence}%</span>
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
        Время: {result.timestamp}
      </p>
      {result.imageUrl && (
        <div className="mt-5 flex justify-center">
          <img
            src={result.imageUrl}
            alt="Изображение результата анализа"
            className="w-48 h-48 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow"
          />
        </div>
      )}
    </motion.div>
  );
}