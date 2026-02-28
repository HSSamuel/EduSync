import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// --- Components ---
import Landing from "./components/Landing";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  // Ensure dark mode is strictly managed by the HTML tag
  useEffect(() => {
    if (!document.documentElement.classList.contains("dark")) {
      // Default to light mode on first load if nothing is set
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors duration-300 flex flex-col items-center">
        {/* The components now manage their own headers! */}
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <div className="mt-10 w-full flex justify-center">
                <Login />
              </div>
            }
          />
          <Route
            path="/register"
            element={
              <div className="mt-10 w-full flex justify-center">
                <Register />
              </div>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <div className="mt-10 w-full flex justify-center">
                <ForgotPassword />
              </div>
            }
          />
          <Route
            path="/reset-password/:token"
            element={
              <div className="mt-10 w-full flex justify-center">
                <ResetPassword />
              </div>
            }
          />

          <Route
            path="/dashboard"
            element={
              <div className="w-full">
                <Dashboard />
              </div>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
