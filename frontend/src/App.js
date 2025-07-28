// frontend/App.js

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { Home as HomeIcon, History as HistoryIcon, Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-gray-900 dark:to-slate-800 text-gray-800 dark:text-gray-100">
        {/* Modern Header */}
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              {/* Logo */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-center"
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <img 
                    src="/logo512.png" 
                    alt="Logo" 
                    className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
                  />
                  <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 select-none">
                    Blueberry Analyzer
                  </h1>
                </div>
              </motion.div>

              {/* Navigation */}
              <motion.nav
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex items-center space-x-4"
              >
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/40 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/40"
                    }`
                  }
                >
                  <HomeIcon className="w-5 h-5" />
                  <span className="hidden md:inline">Анализ</span>
                  {({ isActive }) => isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-100/80 dark:bg-blue-900/40 rounded-xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </NavLink>
                
                <NavLink
                  to="/history"
                  className={({ isActive }) =>
                    `relative inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                      isActive
                        ? "text-blue-700 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-900/40 shadow-sm"
                        : "text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/80 dark:hover:bg-gray-800/40"
                    }`
                  }
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span className="hidden md:inline">История</span>
                  {({ isActive }) => isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-blue-100/80 dark:bg-blue-900/40 rounded-xl -z-10"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </NavLink>

                {/* Theme Toggle */}
                <motion.button
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  onClick={toggleTheme}
                  className="relative p-2 sm:p-2.5 rounded-xl bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200/80 dark:hover:bg-gray-700/80 text-gray-600 dark:text-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 shadow-sm"
                  aria-label="Переключить тему"
                >
                  <motion.div
                    initial={false}
                    animate={{ rotate: darkMode ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  </motion.div>
                </motion.button>
              </motion.nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}