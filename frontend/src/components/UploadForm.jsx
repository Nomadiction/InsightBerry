// frontend/src/components/UploadForm.jsx

import { useState, useRef } from "react";
import { analyzeImage } from "../api/realApi";
import { CloudUpload, Loader2, Trash2, Image as ImageIcon, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ResultCard from "./ResultCard";
import { ErrorBoundary } from "./ErrorBoundary";

window.onerror = function (message, source, lineno, colno, error) {
  if (message === "Script error." && !source) return;

  console.error("Global error caught:", { message, source, lineno, colno, error });

  if (error && error.stack) {
    alert(
      "Произошла ошибка:\n" + message + "\n" + error.stack
    );
  } else if (message && message !== "Script error.") {
    alert("Ошибка: " + message);
  }
};


export default function UploadForm() {
  const [image, setImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setImage(selected);
    setResult(null);
    setProgress(0);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
      setResult(null);
      setProgress(0);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleClear = () => {
    setImage(null);
    setResult(null);
    setProgress(0);
    inputRef.current.value = null;
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setProgress(0);

    const toBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

    try {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + Math.random() * 5;
        });
      }, 150);

      const analysis = await analyzeImage(image);
      clearInterval(interval);
      setProgress(100);

      const base64 = await toBase64(image);
      const analysisWithImage = { ...analysis, imageUrl: base64 };
      setResult(analysisWithImage);
      localStorage.setItem("updateHistory", Date.now());

      console.log("ANALYSIS RESULT", analysis);
      console.log("BASE64", base64);
      console.log("analysisWithImage", analysisWithImage);

    } catch (error) {
      alert(
        "Ошибка анализа: " +
        (error?.message || error?.toString() || JSON.stringify(error))
      );
      console.error("Ошибка анализа:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="w-full max-w-md p-4 sm:p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 mx-auto"
    >
      <div className="relative z-10 space-y-4 sm:space-y-7">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 dark:text-white tracking-tight mb-1 sm:mb-2 text-center">
          Анализ фото голубики
        </h1>
        <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg mb-2 sm:mb-4 leading-relaxed text-center">
          Загрузите фото куста голубики для анализа состояния растения.
        </p>

        <div
          tabIndex={0}
          aria-label="Область загрузки изображения"
          onDrop={!isMobile ? handleDrop : undefined}
          onDragOver={!isMobile ? handleDragOver : undefined}
          onDragLeave={!isMobile ? handleDragLeave : undefined}
          className={`w-full min-h-[160px] sm:min-h-[180px] flex flex-col items-center justify-center p-5 sm:p-8 border-2 border-dashed rounded-2xl text-center transition-all duration-300 cursor-pointer relative outline-none
            ${dragActive && !isMobile ? "border-blue-500 bg-blue-100/70 dark:bg-blue-900/40 shadow-lg scale-105" : "border-gray-300 dark:border-gray-700 bg-white/70 dark:bg-gray-800/70"}
            hover:border-blue-400 dark:hover:border-blue-300 group focus:ring-2 focus:ring-blue-400`}
          onClick={() => inputRef.current.click()}
        >
          <div className="flex flex-col items-center justify-center gap-2 w-full">
            {image ? (
              <div className="flex flex-col items-center w-full">
                <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-2 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    aria-label="Удалить изображение"
                    onClick={handleClear}
                    className="absolute top-1 right-1 bg-white/80 dark:bg-gray-800/40 rounded-full p-1 shadow hover:bg-red-100 dark:hover:bg-red-900 transition"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button>
                </div>
                <p className="text-base font-semibold text-gray-700 dark:text-gray-200 break-all">
                  Файл: <span className="font-bold text-blue-600 dark:text-blue-300">{image.name}</span>
                </p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 mb-2 text-blue-400 dark:text-blue-300" />
                <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {isMobile ? "Нажмите для выбора фото" : "Перетащите файл или нажмите для выбора"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG, HEIC, WEBP</p>
              </>
            )}
          </div>
          {dragActive && !isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-200/40 dark:bg-blue-900/30 rounded-2xl pointer-events-none"
            />
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          tabIndex={-1}
        />

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full mt-2 sm:mt-4">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="
              inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3
              bg-blue-200 hover:bg-blue-300 dark:bg-blue-700 dark:hover:bg-blue-800
              text-blue-900 dark:text-white
              font-bold rounded-xl shadow-md border-none
              focus:outline-none focus:ring-2 focus:ring-blue-300/40
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-base sm:text-lg
            "
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5 mr-2" />
            ) : (
              <CloudUpload className="w-5 h-5 mr-2" />
            )}
            {loading ? "Анализ..." : "Анализировать"}
          </motion.button>

          {image && !loading && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleClear}
              className="
                inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-3
                bg-pink-100 hover:bg-pink-200 dark:bg-pink-800 dark:hover:bg-pink-700
                text-pink-700 dark:text-pink-200
                font-bold rounded-xl shadow-md border-none
                focus:outline-none focus:ring-2 focus:ring-pink-300/40
                transition-all duration-200 text-base sm:text-lg
              "
            >
              <Trash2 className="w-5 h-5 mr-2" /> Очистить
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-400 rounded-full"
                  style={{ width: `${progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                ></motion.div>
              </div>
              <p className="mt-2 text-sm text-blue-700 dark:text-blue-300 font-medium animate-pulse text-center">
                Анализ изображения...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <ErrorBoundary>
              <ResultCard result={result} />
            </ErrorBoundary>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}