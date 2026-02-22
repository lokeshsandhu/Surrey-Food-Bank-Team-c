import { Navigate, useLocation } from "react-router";

export default function AdminRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem("token");

  if (!token) {
    // send them to login, and remember where they tried to go
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  
  return children;
}