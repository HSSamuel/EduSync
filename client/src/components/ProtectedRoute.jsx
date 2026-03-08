import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import DashboardSkeleton from "./DashboardSkeleton";
import { getAccessToken } from "../utils/api";

const ProtectedRoute = ({ children }) => {
  const { userData, loading } = useAppContext();
  const location = useLocation();
  const token = getAccessToken();

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!token || !userData) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
