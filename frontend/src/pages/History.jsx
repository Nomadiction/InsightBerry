// frontend/src/pages/History.jsx

import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2, MoreVertical, Filter, HelpCircle, Info } from "lucide-react";

export default function History() {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const [history, setHistory] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [expandedImageUrl, setExpandedImageUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [adviceItem, setAdviceItem] = useState(null);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/history")
      .then(res => res.json())
      .then(data => {
        const adapted = data.map(item => ({
          ...item,
          timestamp: new Date(item.timestamp).toLocaleString(),
        }));
        setHistory(adapted);
      })
      .catch(err => console.error("Ошибка загрузки истории:", err));
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!expandedImageUrl) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setExpandedImageUrl(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImageUrl]);

  const handleDelete = async (imageId) => {
    try {
      await fetch(`http://127.0.0.1:8000/history/${imageId}`, { method: "DELETE" });
      setHistory(prev => prev.filter(item => item.imageId !== imageId));
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  const handleClearHistory = async () => {
    await fetch(`http://127.0.0.1:8000/history`, { method: "DELETE" });
    setHistory([]);
    setConfirmDelete(false);
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    const onStart = (e) => {
      isDragging.current = true;
      container.style.cursor = "grabbing";
      startY.current = isTouch ? e.touches[0].clientY : e.pageY;
      scrollTop.current = container.scrollTop;
    };

    const onMove = (e) => {
      if (!isDragging.current) return;
      const y = isTouch ? e.touches[0].clientY : e.pageY;
      const walk = (y - startY.current) * 1.2; // чувствительность
      container.scrollTop = scrollTop.current - walk;
    };

    const onEnd = () => {
      isDragging.current = false;
      container.style.cursor = "default";
    };

    if (isTouch) {
      container.addEventListener("touchstart", onStart, { passive: true });
      container.addEventListener("touchmove", onMove, { passive: false });
      container.addEventListener("touchend", onEnd);
    } else {
      container.addEventListener("mousedown", onStart);
      container.addEventListener("mousemove", onMove);
      container.addEventListener("mouseup", onEnd);
      container.addEventListener("mouseleave", onEnd);
    }

    return () => {
      if (isTouch) {
        container.removeEventListener("touchstart", onStart);
        container.removeEventListener("touchmove", onMove);
        container.removeEventListener("touchend", onEnd);
      } else {
        container.removeEventListener("mousedown", onStart);
        container.removeEventListener("mousemove", onMove);
        container.removeEventListener("mouseup", onEnd);
        container.removeEventListener("mouseleave", onEnd);
      }
    };
  }, []);

  let displayedHistory = [...history];
  if (filterType === "date") {
    displayedHistory.sort((a, b) => sortDirection === "desc"
      ? new Date(b.timestamp) - new Date(a.timestamp)
      : new Date(a.timestamp) - new Date(b.timestamp));
  } else if (filterType === "confidence") {
    displayedHistory.sort((a, b) => sortDirection === "desc"
      ? b.confidence - a.confidence
      : a.confidence - b.confidence);
  } else if (filterType === "status") {
    displayedHistory.sort((a, b) => a.status.localeCompare(b.status, "ru"));
  }
  const filteredHistory = displayedHistory.filter(item =>
    filterStatus === "all" ? true : item.status === filterStatus
  );

  // Собрать уникальные статусы для фильтрации по признаку
  const uniqueStatuses = Array.from(new Set(history.map(item => item.status)));

  return (
    <div className="min-h-screen flex justify-center bg-transparent px-2 pt-2 sm:pt-3">
      <section className="w-full max-w-2xl mx-auto bg-white/95 dark:bg-gray-900/95 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col mb-12">
        <div className="flex flex-row items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2 mb-6 px-4 relative">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap leading-none ml-4 -mt-1">
            Анализы
          </h2>
          <div className="flex-shrink-0 flex items-center ml-4">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition mt-1"
              aria-label="Меню"
            >
              <MoreVertical className="w-6 h-6 align-middle" />
            </button>
            {menuOpen && !filterMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Закрыть меню"
                  tabIndex={-1}
                />
                <div className="absolute top-full right-0 -mt-3.5 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-lg z-20">
                  <button
                    onClick={() => {
                      setFilterMenuOpen(true);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900 font-semibold rounded-xl transition"
                  >
                    <Filter className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Фильтрация
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      // Создаем скрытую ссылку для скачивания
                      const link = document.createElement('a');
                      link.href = "http://127.0.0.1:8000/history/export";
                      link.download = "blueberry-analysis-history.pdf";
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900 font-semibold rounded-xl transition"
                  >
                    <svg
                      className="w-5 h-5 text-green-600 dark:text-green-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                      <path d="M7 10l5 5 5-5" />
                      <path d="M12 15V3" />
                    </svg>
                    Экспорт PDF
                  </button>

                  {history.length > 0 && (
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        setConfirmDelete(true);
                      }}
                      className="w-full flex items-center gap-2 text-left px-4 py-2 text-pink-600 dark:text-pink-400 hover:bg-pink-50 dark:hover:bg-pink-900 rounded-xl transition"
                    >
                      <Trash2 className="w-5 h-5 text-pink-400 dark:text-pink-500" />
                      Очистить историю
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowHelp(true);
                    }}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition"
                  >
                    <HelpCircle className="w-5 h-5" />
                    Справка
                  </button>
                </div>
              </>
            )}
            {filterMenuOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
                  <button
                    onClick={() => {
                      setFilterMenuOpen(false);
                      setMenuOpen(true);
                    }}
                    className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 transition"
                    aria-label="Закрыть фильтр"
                  >
                    <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Фильтрация</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setFilterType("date");
                      }}
                      className={`w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl transition ${filterType === "date" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                    >
                      По дате
                    </button>
                    {filterType === "date" && (
                      <div className="flex gap-2 ml-6 mt-1">
                        <button
                          onClick={() => setSortDirection("desc")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${sortDirection === "desc" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                        >По убыванию</button>
                        <button
                          onClick={() => setSortDirection("asc")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${sortDirection === "asc" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                        >По возрастанию</button>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setFilterType("status");
                      }}
                      className={`w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl transition ${filterType === "status" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                    >
                      По признаку
                    </button>
                    {filterType === "status" && (
                      <div className="flex flex-col gap-1 ml-6 mt-1">
                        <button
                          onClick={() => setFilterStatus("all")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filterStatus === "all" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                        >Показать все</button>
                        {uniqueStatuses.map(status => (
                          <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${filterStatus === status ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                          >{status}</button>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setFilterType("confidence");
                      }}
                      className={`w-full flex items-center gap-2 text-left px-4 py-2 rounded-xl transition ${filterType === "confidence" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                    >
                      По проценту
                    </button>
                    {filterType === "confidence" && (
                      <div className="flex gap-2 ml-6 mt-1">
                        <button
                          onClick={() => setSortDirection("desc")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${sortDirection === "desc" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                        >По убыванию</button>
                        <button
                          onClick={() => setSortDirection("asc")}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition ${sortDirection === "asc" ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"}`}
                        >По возрастанию</button>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between mt-6 gap-2">
                    <button
                      onClick={() => {
                        setFilterType('date');
                        setSortDirection('desc');
                        setFilterStatus('all');
                      }}
                      className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold shadow hover:bg-gray-300 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 transition"
                    >
                      Сбросить фильтры
                    </button>
                    <button
                      onClick={() => {
                        setFilterMenuOpen(false);
                        setMenuOpen(false);
                      }}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow focus:ring-2 focus:ring-blue-400 transition dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white"
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {confirmDelete && (
          isMobile
            ? <BottomSheetConfirmDelete onConfirm={handleClearHistory} onCancel={() => setConfirmDelete(false)} />
            : <ModalConfirmDelete onConfirm={handleClearHistory} onCancel={() => setConfirmDelete(false)} />
        )}

        {expandedImageUrl && (
          <ImageModal
            src={expandedImageUrl}
            onClose={() => setExpandedImageUrl(null)}
            isMobile={isMobile}
          />
        )}

        {adviceItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
              <button
                onClick={() => setAdviceItem(null)}
                className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 transition"
                aria-label="Закрыть"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Рекомендации</h3>
              <p className="text-gray-700 dark:text-gray-300 text-base whitespace-pre-line">
                {getAdviceText(adviceItem.status)}
              </p>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
              <button
                onClick={() => setShowHelp(false)}
                className="absolute top-3 right-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-full p-2 hover:bg-gray-200 dark:hover:bg-gray-700 focus:ring-2 focus:ring-blue-400 transition"
                aria-label="Закрыть справку"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 text-center">Справка</h3>
              <div className="text-gray-700 dark:text-gray-200 text-base space-y-3">
                <p>В этом разделе отображается история всех ваших анализов.</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Вы можете <b>экспортировать</b> историю в PDF.</li>
                  <li>Импортировать историю из файла (JSON).</li>
                  <li>Сортировать и фильтровать записи.</li>
                  <li>Для удаления отдельной записи используйте иконку корзины.</li>
                  <li>Для полной очистки — пункт меню.</li>
                  <li>Все данные хранятся только на вашем устройстве.</li>
                </ul>
              </div>
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setShowHelp(false)}
                  className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow focus:ring-2 focus:ring-blue-400 transition dark:bg-blue-700 dark:hover:bg-blue-800 dark:text-white"
                >
                  Понятно
                </button>
              </div>
            </div>
          </div>
        )}

        <motion.div
          initial={{ maxHeight: 320 }}
          animate={{ maxHeight: history.length === 0 ? 320 : window.innerHeight * 0.7 }}
          transition={{ duration: 0.5, type: "spring" }}
          className={`flex-1 w-full ${history.length === 0 ? "overflow-hidden" : "overflow-y-auto"} transition-all duration-300`}
        >
          {history.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 select-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, type: "spring" }}
                className="flex flex-col items-center"
              >
                <svg
                  className="w-16 h-16 mb-6 text-sky-300 dark:text-sky-700"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  viewBox="0 0 48 48"
                >
                  <rect x="12" y="20" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="2.2" />
                  <path d="M18 20v-4a6 6 0 0 1 12 0v4" stroke="currentColor" strokeWidth="2.2" />
                </svg>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
                  className="text-xl font-semibold text-gray-400 dark:text-gray-500 mb-2 text-center"
                >
                  Нет истории анализов
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, type: "spring" }}
                  className="text-base text-gray-400 dark:text-gray-600 text-center"
                >
                  Проведите первый анализ, загрузив изображение куста.
                </motion.p>
              </motion.div>
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="flex-1 w-full max-h-[70vh] overflow-y-auto px-2 py-2 pb-6 hide-scrollbar"
            >
              <ul className="flex flex-col gap-4">
                {filteredHistory.map((item, index) => (
                  <HistoryCard
                    key={item.imageId}
                    item={item}
                    index={index}
                    onDelete={() => handleDelete(item.imageId)}
                    setExpandedImageUrl={setExpandedImageUrl}
                    setAdviceItem={setAdviceItem}
                  />
                ))}
              </ul>
            </div>
          )}
        </motion.div>
      </section>
    </div>
  );
}

function HistoryCard({ item, index, onDelete, setExpandedImageUrl, setAdviceItem }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const infoButtonRef = useRef(null);

  useEffect(() => {
    if (!item.imageId) {
      console.warn("History item без imageId:", item);
      return;
    }
    setImageUrl(item.imageUrl);
  }, [item]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        infoButtonRef.current && !infoButtonRef.current.contains(e.target)
      ) {
        setShowTooltip(false);
      }

      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    const handleScroll = () => {
      setShowTooltip(false);
      setMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  return (
    <motion.li
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.45,
        type: "spring",
        stiffness: 40,
        damping: 12,
        delay: index * 0.06
      }}
      className="group flex flex-row items-center gap-4 p-5 rounded-2xl shadow-lg bg-gray-50/95 dark:bg-gray-800/95 border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition relative"
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt="preview"
          onClick={() => setExpandedImageUrl(imageUrl)}
          className="w-24 h-24 object-cover rounded-xl border border-gray-200 dark:border-gray-700 shadow cursor-zoom-in transition"
        />
      )}
      <div className="flex-1 flex flex-col justify-center">
        <p className="font-semibold text-blue-700 dark:text-blue-200 mb-1">{item.status}</p>
        <p className="text-sm text-gray-700 dark:text-gray-200 mb-1">
          Уверенность: <span className="font-medium">{item.confidence}%</span>
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{item.timestamp}</p>
      </div>

      {/* Кнопка удаления */}
      <button
        ref={buttonRef}
        onClick={() => setMenuOpen(v => !v)}
        className="absolute top-3 right-3 p-1 rounded-full bg-transparent opacity-100 hover:bg-pink-100 dark:hover:bg-pink-800 transition"
        aria-label="Удалить"
      >
        <Trash2 className="w-5 h-5 text-pink-400 dark:text-pink-500 hover:text-pink-600 dark:hover:text-pink-300" />
      </button>

      {/* Кнопка рекомендаций */}
      <div className="absolute top-3 right-11">
        <div className="relative">
          <button
            ref={infoButtonRef}
            onClick={() => setShowTooltip((prev) => !prev)}
            className="p-1 rounded-full bg-transparent opacity-100 hover:bg-blue-100 dark:hover:bg-blue-800 transition"
            aria-label="Рекомендации"
          >
            <Info className="w-5 h-5 text-blue-500 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-100" />
          </button>

          {showTooltip && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-0 w-64 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-3 text-sm text-gray-800 dark:text-gray-100"
            >
              {getAdviceText(item.status)}
            </motion.div>
          )}

        </div>
      </div>

      {/* Меню удаления */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-xl z-50"
        >
          <button
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Удалить
          </button>
        </div>
      )}
    </motion.li>
  );
}

// Перечень соответсвующих рекомендаций
function getAdviceText(status) {
  switch (status) {
    case "Здоровое растение":
      return "Растение находится в оптимальном физиологическом состоянии. Продолжайте стандартный уход: умеренный полив (pH воды ~5.0–5.5), внесение комплексного удобрения с преобладанием фосфора и калия (NPK 10-20-20) каждые 2 недели, поддержание хорошей аэрации почвы и регулярное мульчирование хвойной щепой для поддержания кислой среды.";

    case "Растение в состоянии стресса":
      return "Стресс может быть вызван резкими колебаниями температуры, пересадкой, световым шоком или засолением. Внесите антистрессант с аминокислотами и морскими водорослями (например, экстракт Ascophyllum nodosum), ограничьте воздействие прямого солнца (затенение 40–50%), обеспечьте мягкий полив с добавлением хелатов магния и цинка.";

    case "Признаки плесени":
      return "Плесень чаще всего указывает на переувлажнение и плохую вентиляцию. Удалите поражённые участки, обработайте 0.1% раствором меди (медный купорос или хлорокись меди), затем примените биофунгицид на основе Trichoderma harzianum. Улучшите дренаж, уменьшите полив, и избегайте намокания листьев при орошении.";

    case "Недостаток влаги (пересушено)":
      return "Недостаток влаги приводит к понижению тургора и нарушению транспирации. Проведите капельный полив с добавлением гуминовых кислот (0.01–0.02%) и калия в форме сульфата калия (K₂SO₄). Избегайте шокового переувлажнения. Поверхностно мульчируйте хвойной корой или сфагнумом для удержания влаги.";

    default:
      return "Для данного состояния пока нет научно подтверждённых рекомендаций. Уточните параметры среды и физиологические признаки.";
  }
}

// BottomSheetConfirmDelete — bottom sheet для мобильных
function BottomSheetConfirmDelete({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-40 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl p-8 w-full max-w-md mx-auto border border-gray-200 dark:border-gray-700 relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900">
            <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="currentColor" className="text-pink-100 dark:text-pink-900" />
              <text x="16" y="22" textAnchor="middle" fontSize="20"
                className="text-pink-600 dark:text-pink-400 font-bold"
                fill="currentColor">!</text>
            </svg>
          </span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Удалить всю историю?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Это действие <span className="text-pink-600 dark:text-pink-400 font-semibold">необратимо</span>. Вы уверены, что хотите удалить все записи анализов?
          </p>
          <div className="flex gap-4 w-full">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-pink-100 hover:bg-pink-200 dark:bg-pink-800 dark:hover:bg-pink-700 text-pink-700 dark:text-pink-200 font-semibold shadow focus:ring-2 focus:ring-pink-300/40 transition text-sm"
              autoFocus
            >
              Да, удалить
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 transition text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ModalConfirmDelete — модалка для ПК
function ModalConfirmDelete({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700 relative">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900">
            <svg width="32" height="32" fill="none" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="16" fill="currentColor" className="text-pink-100 dark:text-pink-900" />
              <text x="16" y="22" textAnchor="middle" fontSize="20"
                className="text-pink-600 dark:text-pink-400 font-bold"
                fill="currentColor">!</text>
            </svg>
          </span>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Удалить всю историю?</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 text-sm">
            Это действие <span className="text-pink-600 dark:text-pink-400 font-semibold">необратимо</span>. Вы уверены, что хотите удалить все записи анализов?
          </p>
          <div className="flex gap-4 w-full">
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 rounded-lg bg-pink-100 hover:bg-pink-200 dark:bg-pink-800 dark:hover:bg-pink-700 text-pink-700 dark:text-pink-200 font-semibold shadow focus:ring-2 focus:ring-pink-300/40 transition text-sm"
              autoFocus
            >
              Да, удалить
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-2 focus:ring-gray-400 transition text-sm"
            >
              Отмена
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ImageModal — модалка для увеличенного фото
function ImageModal({ src, onClose, isMobile }) {
  const startY = useRef(null);

  const handleTouchStart = useCallback((e) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (startY.current !== null) {
      const endY = e.changedTouches[0].clientY;
      if (endY - startY.current > 60) onClose();
      startY.current = null;
    }
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      tabIndex={-1}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.98, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Увеличенное изображение"
          className={`max-w-full max-h-[80vh] rounded-xl shadow-2xl ${isMobile ? "w-[96vw] h-auto" : "w-auto h-auto"}`}
          draggable={false}
        />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-2 hover:bg-opacity-80 focus:ring-2 focus:ring-blue-400 transition"
          aria-label="Закрыть"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path d="M6 6l12 12M6 18L18 6" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </motion.div>
    </motion.div>
  );
}
