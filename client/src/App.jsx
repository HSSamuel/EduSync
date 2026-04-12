import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./components/Landing";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import ProtectedRoute from "./components/ProtectedRoute";

// 1. Dynamically import the Dashboard only when needed
const Dashboard = lazy(() => import("./components/Dashboard"));

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Routes>
        {/* Synchronous Routes (Fast Initial Load) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Asynchronous Route (Lazy Loaded) */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              {/* 2. Wrap the lazy component in Suspense with a fallback UI */}
              <Suspense
                fallback={
                  <div className="flex h-screen w-full items-center justify-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                      <p className="font-medium animate-pulse">
                        Loading Workspace...
                      </p>
                    </div>
                  </div>
                }
              >
                <Dashboard />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
