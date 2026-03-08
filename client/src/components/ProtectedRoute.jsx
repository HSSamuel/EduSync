import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DashboardSkeleton from "./DashboardSkeleton";

const ProtectedRoute = ({ children }) => {
  const { userData, loading } = useAppContext();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (loading && token) {
    return <DashboardSkeleton />;
  }

  if (!token || !userData) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
