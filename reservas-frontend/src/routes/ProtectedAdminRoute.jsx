// src/routes/ProtectedAdminRoute.jsx
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function ProtectedAdminRoute({ children, adminOnly = false }) {
  const { user } = useContext(AuthContext);

  // Si no hay usuario logueado → redirige a login
  if (!user) return <Navigate to="/login" />;

  // Si es ruta adminOnly y el usuario no es admin → redirige al home
  if (adminOnly && user.role !== "ROLE_ADMIN") return <Navigate to="/" />;

  return children;
}
