import { Navigate, useLocation } from "react-router";
import { notifications } from '@mantine/notifications';

export default function AdminRoute({ children }) {
  const location = useLocation();
  const token = sessionStorage.getItem("token");

  if (!token) {
    // send them to login, and remember where they tried to go
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (sessionStorage.getItem("username") !== "admin") {
    // send them to login, and remember where they tried to go
    notifications.show({
      title: "Access Denied",
      message: "You must be an admin to access this page.",
      color: "red",
    });

    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}