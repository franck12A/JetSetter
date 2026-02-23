// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedAdminRoute from "./routes/ProtectedAdminRoute";

// Páginas
import Home from "./pages/Home/Home";
import AdminPanel from "./pages/AdminPanel/AdminPanel";
import Resultados from "./pages/Resultados/Resultados.jsx";
import DetalleVuelo from "./pages/DetalleVuelo/DetalleVuelo.jsx";
import GaleriaPage from "./pages/GaleriaPage/GaleriaPage.jsx";
import AdminProductsListPage from "./pages/AdminProductsListPage/AdminProductsListPage";
import Register from "./pages/Register/Register.jsx";
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import AdminUsersPage from "./pages/AdminPanel/AdminUsersPage";



export default function App() {
  return (
    <Routes>
      {/* 🌍 Públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/resultados" element={<Resultados />} />
      <Route path="/vuelo/:id" element={<DetalleVuelo />} />
      <Route path="/galeria/:id" element={<GaleriaPage />} />



      {/* 🔒 Protegidas (requieren login) */}
      <Route
        path="/profile"
        element={
          <ProtectedAdminRoute>
            <Profile />
          </ProtectedAdminRoute>
        }
      />

      {/* 🔑 Solo para admins */}
      <Route
        path="/admin"
        element={
          <ProtectedAdminRoute adminOnly>
            <AdminPanel />
          </ProtectedAdminRoute>
        }
      />
      <Route
        path="/admin/lista-vuelos"
        element={
          <ProtectedAdminRoute adminOnly>
            <AdminProductsListPage />
          </ProtectedAdminRoute>
        }
      />
   <Route
     path="/admin/usuarios"
     element={
       <ProtectedAdminRoute adminOnly>
         <AdminUsersPage />
       </ProtectedAdminRoute>
     }
   />

    </Routes>
  );
}
