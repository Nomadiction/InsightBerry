// frontend/App.js

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Home as HomeIcon, History as HistoryIcon, Moon, Sun } from "lucide-react";
import Home from "./pages/Home";
import History from "./pages/History";

export default function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const toggleTheme = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return newMode;
    });
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-100">
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 shadow-md border-b border-gray-200 dark:border-gray-700 backdrop-blur">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold text-blue-700 dark:text-blue-300 select-none">Blueberry Analyzer</h1>
            <div className="flex items-center gap-4 sm:gap-6">
              <nav className="space-x-4 sm:space-x-6 flex items-center">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    "inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-all " +
                    (isActive
                      ? "text-blue-600 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/40 font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30")
                  }
                >
                  <HomeIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Главная</span>
                </NavLink>
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    "inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-all " +
                    (isActive
                      ? "text-blue-600 dark:text-blue-300 bg-blue-100/60 dark:bg-blue-900/40 font-semibold"
                      : "text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-100/40 dark:hover:bg-blue-900/30")
                  }
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">История</span>
                </NavLink>
              </nav>
              <button
                onClick={toggleTheme}
                className="p-2 sm:p-2.5 rounded-full bg-blue-100/70 hover:bg-blue-200/90 dark:bg-gray-700/80 dark:hover:bg-gray-600/90 text-blue-700 dark:text-blue-300 transition-all focus:ring-2 focus:ring-blue-300"
                aria-label="Переключить тему"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8 max-w-5xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}