// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";
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
import Reserva from "./pages/Reserva/Reserva.jsx";
import ReservaConfirmacion from "./pages/ReservaConfirmacion/ReservaConfirmacion.jsx";
import FloatingWhatsApp from "./components/FloatingWhatsApp/FloatingWhatsApp";

import "./app.css";
import BottomNav from "./components/BottomNav/BottomNav";


function App() {
  const location = useLocation();
  const showWhatsapp = ["/", "/profile"].includes(location.pathname) || location.pathname.startsWith("/vuelo/");

  return (
    <main>
      <Routes>
        {/* 🌍 Públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resultados" element={<Resultados />} />
        <Route path="/vuelo/:id" element={<DetalleVuelo />} />
        <Route path="/galeria/:id" element={<GaleriaPage />} />
        <Route path="/reserva/:id" element={<Reserva />} />
        <Route path="/reserva/confirmacion/:id" element={<ReservaConfirmacion />} />

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
          path="/administracion"
          element={
            <ProtectedAdminRoute adminOnly>
              <AdminPanel />
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/administraci\u00f3n"
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
          path="/administracion/lista-vuelos"
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
        <Route
          path="/administracion/usuarios"
          element={
            <ProtectedAdminRoute adminOnly>
              <AdminUsersPage />
            </ProtectedAdminRoute>
          }
        />
      </Routes>
      {showWhatsapp && <FloatingWhatsApp />}
    </main>
  );
}

export default App;







