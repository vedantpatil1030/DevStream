// src/components/layout/ProtectedRoute.jsx

import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { selectIsAuthenticated } from "../../features/auth/authSlice";

export default function ProtectedRoute() {
  const isAuthenticated = useSelector(selectIsAuthenticated);

  return isAuthenticated
    ? <Outlet />
    : <Navigate to="/login" replace />;
}


