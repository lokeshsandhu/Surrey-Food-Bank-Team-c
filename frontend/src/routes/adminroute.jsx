import { Navigate, useLocation } from "react-router";
import { notifications } from '@mantine/notifications';
import React from "react";

export default function AdminRoute({ children }) {

 const location = useLocation();
  const token = sessionStorage.getItem("token");
  React.useEffect(() => {
    // ...existing code...
  }, []);

  if (!token) {
    // send them to login, and remember where they tried to go
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (token && sessionStorage.getItem("username") !== "admin") {
    // Pass a flag to login page to show notification
    return <Navigate to="/login" replace state={{ from: location.pathname, adminDenied: true }} />;
  }

  return children;
}