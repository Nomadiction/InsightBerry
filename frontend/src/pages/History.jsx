// frontend/src/pages/History.jsx

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, HelpCircle, Info, X, Settings, AlertTriangle, Filter} from "lucide-react";

const API_BASE = "https://insightberry.onrender.com";

export default function History() {
  const scrollRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTop = useRef(0);

  const [history, setHistory] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [expandedImageUrl, setExpandedImageUrl] = useState(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [bottomSheetType, setBottomSheetType] = useState(null); // 'filter', 'help', 'settings'
  const [showHelp, setShowHelp] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  const [adviceItem, setAdviceItem] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/history`)
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
    const handleStorageUpdate = (e) => {
      if (e.key === "updateHistory") {
        fetch(`${API_BASE}/history`)
          .then(res => res.json())
          .then(data => {
            const adapted = data.map(item => ({
              ...item,
              timestamp: new Date(item.timestamp).toLocaleString(),
            }));
            setHistory(adapted);
          })
          .catch(err => console.error("Ошибка обновления истории:", err));
      }
    };

    window.addEventListener("storage", handleStorageUpdate);
    return () => window.removeEventListener("storage", handleStorageUpdate);
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
      await fetch(`${API_BASE}/history/${imageId}`, { method: "DELETE" });
      setHistory(prev => prev.filter(item => item.imageId !== imageId));
    } catch (error) {
      console.error("Ошибка удаления:", error);
    }
  };

  const handleClearHistory = async () => {
    await fetch(`${API_BASE}/history`, { method: "DELETE" });
    setHistory([]);
    setConfirmDelete(false);
    setBottomSheetOpen(false);
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
      const walk = (y - startY.current) * 1.2;
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

  // Тестовые карточки для отладки интерфейса
  if (history.length === 0) {
    setHistory([
      {
        imageId: "test1.jpg",
        imageUrl: "https://via.placeholder.com/96x96.png?text=Healthy",
        status: "Здоровое растение",
        confidence: 98.7,
        timestamp: new Date().toLocaleString()
      },
      {
        imageId: "test2.jpg",
        imageUrl: "https://via.placeholder.com/96x96.png?text=Stress",
        status: "Растение в состоянии стресса",
        confidence: 75.4,
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toLocaleString()
      },
      {
        imageId: "test3.jpg",
        imageUrl: "https://via.placeholder.com/96x96.png?text=Mold",
        status: "Признаки плесени",
        confidence: 89.1,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleString()
      }
    ]);
  }

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

  const uniqueStatuses = Array.from(new Set(history.map(item => item.status)));

  const openBottomSheet = (type) => {
    setBottomSheetType(type);
    setBottomSheetOpen(true);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Main Content Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-6 sm:p-8 lg:p-10"
      >
        {/* Header with Settings */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            История анализов
          </h2>
          <button
            onClick={() => openBottomSheet('settings')}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-400/30 dark:focus:ring-gray-600/30"
            aria-label="Настройки"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full overflow-y-auto hide-scrollbar">
          {history.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="space-y-4 sm:space-y-6">
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
            </div>
          )}
        </div>
      </motion.div>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {bottomSheetOpen && (
          <BottomSheet
            type={bottomSheetType}
            onClose={() => setBottomSheetOpen(false)}
            onFilterChange={(type, status, direction) => {
              setFilterType(type);
              setFilterStatus(status);
              setSortDirection(direction);
            }}
            onClearHistory={() => setConfirmDelete(true)}
            onShowHelp={() => setShowHelp(true)}
            uniqueStatuses={uniqueStatuses}
            filterType={filterType}
            filterStatus={filterStatus}
            sortDirection={sortDirection}
            openBottomSheet={openBottomSheet}
          />
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {expandedImageUrl && (
          <ImageModal
            src={expandedImageUrl}
            onClose={() => setExpandedImageUrl(null)}
            isMobile={isMobile}
          />
        )}
        {adviceItem && (
          <AdviceModal
            item={adviceItem}
            onClose={() => setAdviceItem(null)}
          />
        )}
        {confirmDelete && (
          <ConfirmDeleteModal
            onConfirm={handleClearHistory}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
        {showHelp && (
          <HelpModal
            onClose={() => setShowHelp(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// iOS Style Empty State
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4">
      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
        Нет истории анализов
      </h3>
      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 text-center max-w-xs sm:max-w-sm lg:max-w-md">
        Проведите первый анализ, загрузив изображение куста голубики
      </p>
    </div>
  );
}

// iOS Style History Card
function HistoryCard({ item, index, onDelete, setExpandedImageUrl, setAdviceItem }) {
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    setImageUrl(item.imageUrl);
  }, [item]);

  const getProgressColor = (confidence) => {
    if (confidence >= 85) return "bg-green-500";
    if (confidence >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200/60 dark:border-gray-700/60 overflow-hidden hover:shadow-xl transition-all duration-200"
    >
      <div className="p-5 sm:p-6 lg:p-8">
        <div className="flex items-center space-x-4 sm:space-x-6">
          <div className="flex-shrink-0">
            <img
              src={imageUrl || "/logo192.png"}
              alt="Preview"
              className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl sm:rounded-2xl object-cover border-2 border-gray-200 dark:border-gray-600 shadow-lg"
              onError={e => { e.target.onerror = null; e.target.src = "/logo192.png"; }}
              onClick={() => imageUrl && setExpandedImageUrl(imageUrl)}
              style={{ cursor: imageUrl ? "pointer" : "default" }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              {item.status}
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm sm:text-base text-gray-600 dark:text-gray-300 mb-2">
                  <span>Уверенность</span>
                  <span className="font-semibold">{item.confidence}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 shadow-inner overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(item.confidence)}`}
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                {item.timestamp}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex border-t border-gray-200/60 dark:border-gray-700/60">
        <button
          onClick={() => setAdviceItem(item)}
          className="flex-1 flex items-center justify-center py-4 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 font-semibold"
        >
          <Info className="w-5 h-5 mr-2" />
          <span className="text-sm sm:text-base">Рекомендации</span>
        </button>
        <div className="w-px bg-gray-200/60 dark:border-gray-700/60" />
        <button
          onClick={onDelete}
          className="flex-1 flex items-center justify-center py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-semibold"
        >
          <Trash2 className="w-5 h-5 mr-2" />
          <span className="text-sm sm:text-base">Удалить</span>
        </button>
      </div>
    </motion.div>
  );
}

// iOS Style Bottom Sheet
function BottomSheet({ type, onClose, onFilterChange, onClearHistory, onShowHelp, uniqueStatuses, filterType, filterStatus, sortDirection, openBottomSheet }) {
  const [localFilterType, setLocalFilterType] = useState(filterType);
  const [localFilterStatus, setLocalFilterStatus] = useState(filterStatus);
  const [localSortDirection, setLocalSortDirection] = useState(sortDirection);

  const handleApply = () => {
    onFilterChange(localFilterType, localFilterStatus, localSortDirection);
    onClose();
  };

  const renderContent = () => {
    switch (type) {
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Настройки
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Управление историей анализов
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => {
                  onClose();
                  openBottomSheet('filter');
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center">
                  <Filter className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-900 dark:text-white">Фильтрация</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onShowHelp();
                }}
                className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <div className="flex items-center">
                  <HelpCircle className="w-5 h-5 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-900 dark:text-white">Справка</span>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={() => {
                  onClose();
                  onClearHistory();
                }}
                className="w-full flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all duration-200"
              >
                <div className="flex items-center">
                  <Trash2 className="w-5 h-5 text-red-500 mr-3" />
                  <span className="font-semibold text-red-600 dark:text-red-400">Очистить историю</span>
                </div>
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        );
      
      case 'filter':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Фильтрация
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Настройте отображение записей
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Сортировка по
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'date', label: 'Дате' },
                    { value: 'confidence', label: 'Уверенности' },
                    { value: 'status', label: 'Статусу' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setLocalFilterType(option.value)}
                      className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        localFilterType === option.value
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {localFilterType === 'date' || localFilterType === 'confidence' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Направление
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLocalSortDirection('desc')}
                      className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        localSortDirection === 'desc'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      По убыванию
                    </button>
                    <button
                      onClick={() => setLocalSortDirection('asc')}
                      className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        localSortDirection === 'asc'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      По возрастанию
                    </button>
                  </div>
                </div>
              ) : null}
              
              {localFilterType === 'status' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Статус
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setLocalFilterStatus('all')}
                      className={`w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        localFilterStatus === 'all'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      Показать все
                    </button>
                    {uniqueStatuses.map(status => (
                      <button
                        key={status}
                        onClick={() => setLocalFilterStatus(status)}
                        className={`w-full p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          localFilterStatus === status
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setLocalFilterType('date');
                  setLocalFilterStatus('all');
                  setLocalSortDirection('desc');
                }}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Сбросить
              </button>
              <button
                onClick={handleApply}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-xl font-semibold hover:bg-blue-600 transition-all duration-200"
              >
                Применить
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-end bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        <div className="px-6 pb-8 max-h-[calc(80vh-40px)] overflow-y-auto">
          {renderContent()}
        </div>
      </motion.div>
    </motion.div>
  );
}

// iOS Style Modals
function AdviceModal({ item, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
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
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                {item.status}
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                {getAdviceText(item.status)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ConfirmDeleteModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Очистить историю?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Это действие нельзя отменить. Все записи анализов будут удалены.
          </p>
          
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              Отмена
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all duration-200"
            >
              Удалить
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HelpModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
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
              Справка
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              В этом разделе отображается история всех ваших анализов голубики.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p>Нажмите на изображение для увеличения</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p>Используйте кнопку "Рекомендации" для получения советов по уходу</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p>Фильтруйте записи по дате, уверенности или статусу</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <p>Все данные хранятся локально на вашем устройстве</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-[90vw] max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={src}
          alt="Увеличенное изображение"
          className="max-w-full max-h-full rounded-2xl shadow-2xl"
          draggable={false}
        />
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </motion.div>
  );
}

// Перечень соответствующих рекомендаций
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
