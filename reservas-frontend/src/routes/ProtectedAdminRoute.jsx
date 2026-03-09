// src/routes/ProtectedAdminRoute.jsx
import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { isAdminSession } from "../utils/authRoles";

export default function ProtectedAdminRoute({ children, adminOnly = false }) {
  const { user, token } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;
  const isAdmin = isAdminSession(user, token || localStorage.getItem("token"));

  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return children;
}
