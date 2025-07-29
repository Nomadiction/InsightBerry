// frontend/src/components/UploadForm.jsx

import { useState, useRef } from "react";
import { analyzeImage } from "../api/realApi";
import { CloudUpload, Loader2, Trash2, Camera, Upload, Sparkles, CheckCircle, Info, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [imageBase64, setImageBase64] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [adviceItem, setAdviceItem] = useState(null);
  const inputRef = useRef();

  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;
    setImage(selected);
    setResult(null);
    setProgress(0);
    setShowSuccess(false);

    // Сразу читаем base64!
    const reader = new FileReader();
    reader.readAsDataURL(selected);
    reader.onload = () => setImageBase64(reader.result);
    reader.onerror = (event) => {
      alert("Ошибка чтения файла: " + (event?.target?.error?.message || "Неизвестная ошибка"));
      setImage(null);
      setImageBase64(null);
    };
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setImage(e.dataTransfer.files[0]);
      setResult(null);
      setProgress(0);
      setShowSuccess(false);
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
    setShowSuccess(false);
    inputRef.current.value = null;
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setProgress(0);

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

      // Имитация анализа для демонстрации
      // await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Тестовый результат
      // const testResult = {
      //   status: "Здоровое растение",
      //   confidence: 94.7,
      //   timestamp: new Date().toLocaleString(),
      //   imageUrl: imageBase64,
      //   details: {
      //     health: "Отличное",
      //     stress: "Низкий",
      //     nutrition: "Сбалансированное",
      //     moisture: "Оптимальное"
      //   }
      // };

      const analysis = await analyzeImage(image);
      clearInterval(interval);
      setProgress(100);

      const analysisWithImage = { ...analysis, imageUrl: imageBase64 };
      setResult(analysisWithImage);
      setShowSuccess(true);
      localStorage.setItem("updateHistory", Date.now());

      // Скрыть сообщение об успехе через 3 секунды
      setTimeout(() => setShowSuccess(false), 3000);

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

  const getProgressColor = (confidence) => {
    if (confidence >= 85) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getAdviceText = (status) => {
    switch (status) {
      case "Здоровое растение":
        return "Растение находится в оптимальном физиологическом состоянии. Продолжайте стандартный уход: умеренный полив (pH воды ~5.0–5.5), внесение комплексного удобрения с преобладанием фосфора и калия (NPK 10-20-20) каждые 2 недели, поддержание хорошей аэрации почвы и регулярное мульчирование хвойной щепой для поддержания кислой среды.";
      case "Растение в состоянии стресса":
        return "Стресс может быть вызван резкими колебаниями температуры, пересадкой, световым шоком или засолением. Внесите антистрессант с аминокислотами и морскими водорослями, ограничьте воздействие прямого солнца, обеспечьте мягкий полив с добавлением хелатов магния и цинка.";
      case "Признаки плесени":
        return "Плесень чаще всего указывает на переувлажнение и плохую вентиляцию. Удалите поражённые участки, обработайте 0.1% раствором меди, затем примените биофунгицид. Улучшите дренаж, уменьшите полив.";
      default:
        return "Для данного состояния пока нет научно подтверждённых рекомендаций. Уточните параметры среды и физиологические признаки.";
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-green-500" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Анализ успешно завершён!
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">
                  Результаты готовы к просмотру
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSuccess(false)}
              className="p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/40"
            >
              <X className="w-4 h-4 text-green-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Upload Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 lg:p-10"
      >
        {/* Upload Area */}
        <div
          tabIndex={0}
          aria-label="Область загрузки изображения"
          onDrop={!isMobile ? handleDrop : undefined}
          onDragOver={!isMobile ? handleDragOver : undefined}
          onDragLeave={!isMobile ? handleDragLeave : undefined}
          className={`relative w-full min-h-[200px] sm:min-h-[240px] lg:min-h-[280px] flex flex-col items-center justify-center p-6 sm:p-8 lg:p-10 border-2 border-dashed rounded-xl sm:rounded-2xl transition-all duration-300 cursor-pointer outline-none group
              ${dragActive && !isMobile 
                ? "border-blue-500 bg-blue-50/80 dark:bg-blue-900/50 shadow-lg scale-[1.02] ring-4 ring-blue-100 dark:ring-blue-900/60" 
                : "border-gray-300 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-gray-50/70 dark:hover:bg-gray-800/70"
              }
              focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-900 focus:border-blue-400`}
          onClick={() => inputRef.current.click()}
        >
          <div className="relative flex flex-col items-center justify-center gap-4 sm:gap-6 w-full z-10">
            {image ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="flex flex-col items-center w-full"
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto mb-4 sm:mb-6 rounded-2xl overflow-hidden shadow-xl border-4 border-white/80 dark:border-gray-600/60 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={image.name}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent dark:from-black/40 dark:via-black/20"></div>
                </div>
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <p className="text-sm sm:text-base font-semibold text-gray-800 dark:text-gray-100">
                      Файл загружен
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 break-all max-w-xs">
                    {image.name}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center space-y-4 sm:space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-blue-500/90 to-blue-600/90 dark:from-blue-500/70 dark:to-blue-600/80 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 border border-blue-400/40 dark:border-blue-400/50 backdrop-blur-sm">
                    <Camera className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-blue-50 dark:text-blue-50 drop-shadow-lg" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-600/80 to-green-700/90 dark:from-green-700/70 dark:to-green-800/80 rounded-full flex items-center justify-center shadow-md border border-green-500/30 dark:border-green-600/40 hover:shadow-lg hover:shadow-green-600/20 dark:hover:shadow-green-700/30">
                    <Upload className="w-4 h-4 text-green-50 dark:text-green-200 drop-shadow-sm" />
                  </div>
                </div>
                <div className="space-y-3 sm:space-y-4 text-center">
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {isMobile ? "Нажмите для выбора фото" : "Перетащите файл или нажмите для выбора"}
                  </p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-sm">
                    Поддерживаемые форматы: JPG, PNG, HEIC, WEBP
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Drag Overlay */}
          {dragActive && !isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500/20 dark:bg-blue-700/50 backdrop-blur-sm rounded-xl sm:rounded-2xl pointer-events-none border-2 border-blue-400 dark:border-blue-600"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-2xl flex items-center justify-center shadow-xl border-2 border-blue-200/50 dark:border-blue-600/30">
                    <CloudUpload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-lg font-semibold text-gray-800 dark:text-white drop-shadow-lg">
                    Отпустите файл для загрузки
                  </p>
                </div>
              </div>
            </motion.div>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center w-full mt-6 sm:mt-8">
          {/* Demo Button - Always Visible */}
          {/* <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const testResult = {
                status: "Здоровое растение",
                confidence: 94.7,
                timestamp: new Date().toLocaleString(),
                imageUrl: "https://via.placeholder.com/96x96.png?text=Healthy",
                details: {
                  health: "Отличное",
                  stress: "Низкий",
                  nutrition: "Сбалансированное",
                  moisture: "Оптимальное"
                }
              };
              setResult(testResult);
              setShowSuccess(true);
              setTimeout(() => setShowSuccess(false), 3000);
            }}
            className="
              inline-flex items-center justify-center w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-4
              bg-green-100 hover:bg-green-200 dark:bg-green-600/80 dark:hover:bg-green-500/90
              text-green-700 dark:text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg border-none
              focus:outline-none focus:ring-4 focus:ring-green-400/30 dark:focus:ring-green-600/30
              transition-all duration-200 text-base sm:text-lg
            "
          >
            <CheckCircle className="w-5 h-5 mr-3" /> Показать результат
          </motion.button> */}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAnalyze}
            disabled={!image || loading}
            className="
              inline-flex items-center justify-center w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-4
              bg-blue-100 hover:bg-blue-200 dark:bg-blue-600/80 dark:hover:bg-blue-500/90
              text-blue-700 dark:text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg border-none
              focus:outline-none focus:ring-4 focus:ring-blue-400/30 dark:focus:ring-blue-600/30
              transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed 
              text-base sm:text-lg
            "
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5 mr-3" />
            ) : (
              <Sparkles className="w-5 h-5 mr-3" />
            )}
            {loading ? "Анализ..." : "Анализировать"}
          </motion.button>

          {image && !loading && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleClear}
              className="
                inline-flex items-center justify-center w-full sm:w-auto px-6 py-4 sm:px-8 sm:py-4
                bg-red-100 hover:bg-red-200 dark:bg-red-600/80 dark:hover:bg-red-500/90
                text-red-700 dark:text-white font-semibold rounded-xl sm:rounded-2xl shadow-lg border-none
                focus:outline-none focus:ring-4 focus:ring-red-400/30 dark:focus:ring-red-600/30
                transition-all duration-200 text-base sm:text-lg
              "
            >
              <Trash2 className="w-5 h-5 mr-3" /> Очистить
            </motion.button>
          )}
        </div>

        {/* Progress Bar */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-6 sm:mt-8"
            >
              <div className="space-y-4">
                <div className="relative h-3 sm:h-4 rounded-full bg-gray-200 dark:bg-gray-700 shadow-inner overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 dark:bg-blue-700 rounded-full relative overflow-hidden"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                  </motion.div>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 dark:bg-blue-700 rounded-full animate-pulse"></div>
                  <p className="text-sm sm:text-base text-blue-600 dark:text-blue-400 font-medium">
                    Анализ изображения... {Math.round(progress)}%
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mt-6 sm:mt-8"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <img
                      src={result.imageUrl}
                      alt="Analyzed"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-gray-200 dark:border-gray-600 shadow-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                        {result.status}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-2">
                          <span>Уверенность</span>
                          <span className="font-semibold">{result.confidence}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner overflow-hidden">
                          <motion.div
                            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(result.confidence)}`}
                            style={{ width: `${result.confidence}%` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${result.confidence}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {result.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setAdviceItem(result)}
                  className="flex-1 flex items-center justify-center py-4 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-semibold"
                >
                  <Info className="w-5 h-5 mr-2" />
                  <span className="text-sm">Рекомендации</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Advice Modal */}
      <AnimatePresence>
        {adviceItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => setAdviceItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Рекомендации
                  </h3>
                  <button
                    onClick={() => setAdviceItem(null)}
                    className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                  >
                    <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      {adviceItem.status}
                    </h4>
                    <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                      {getAdviceText(adviceItem.status)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}