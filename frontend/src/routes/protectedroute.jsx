import { Navigate, useLocation } from "react-router";
import React from "react";
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem("token");

  if (!token) {
    // Show notification and redirect to login
    if (window && window.sessionStorage) {
      window.sessionStorage.setItem('notifyLoginRedirect', 'true');
    }
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  
  return children;
}