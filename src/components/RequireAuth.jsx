import { Navigate, useLocation } from "react-router-dom";

export const AUTH_KEY = "hms_token";

export function isLoggedIn() {
  try {
    const token = localStorage.getItem(AUTH_KEY);
    return Boolean(token && String(token).trim() !== "");
  } catch {
    return false;
  }
}

export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
