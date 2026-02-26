import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- Components ---
import Landing from "./components/Landing"; // 👈 NEW: Imported the Front Door
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
// import Register from "./components/Register"; // Uncomment this if you built a Register component earlier!

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col items-center p-4 transition-colors duration-300 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white">
        {/* Universal Header (Shows on every page) */}
        <div className="w-full max-w-4xl flex justify-between items-center py-4 mb-8 border-b dark:border-gray-700">
          <h1 className="text-3xl font-bold tracking-wider">EduSync</h1>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-full font-semibold shadow transition-all duration-300 bg-blue-600 text-white hover:bg-blue-700 dark:bg-yellow-400 dark:text-gray-900 dark:hover:bg-yellow-500"
          >
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* The Traffic Cop (Changes the page based on the URL) */}
        <Routes>
          {/* 👈 NEW: The root URL now shows your beautiful Landing Page! */}
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* <Route path="/register" element={<Register />} /> */}

          {/* Catch-all: If someone types a weird URL, send them home */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
