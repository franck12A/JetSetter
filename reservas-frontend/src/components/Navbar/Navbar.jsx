// src/components/Navbar/Navbar.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaRegBell } from "react-icons/fa";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => setShowMenu(!showMenu);

  const userRole = user?.role?.toUpperCase();

  console.log("🧠 Usuario en Navbar:", user);
  return (
    <header className="navbar">
      {/* === IZQUIERDA: Logo === */}
      <div className="navbar-left" onClick={() => navigate("/")}>
        <div className="navbar-logo">
          <img
            src="\assets\logoJettSeter.png"
            alt="logo"
            className="logo-header"
          />
          <span className="navbar-lema">JetSetter</span>
        </div>
      </div>

      {/* === DERECHA: Usuario / Botones === */}
      <div className="navbar-right">
        {!user ? (
          <>
            <button className="btn-signup" onClick={() => navigate("/register")}>
              Crear Cuenta
            </button>
            <button className="btn-login" onClick={() => navigate("/login")}>
              Iniciar Sesión
            </button>
          </>
        ) : (
          <div className="navbar-user">
            <FaRegBell className="navbar-bell-icon" />
            <div
              className="user-avatar"
              onClick={toggleMenu}
              title="Menú de usuario"
            >
              {user.firstName?.[0]?.toUpperCase()}
              {user.lastName?.[0]?.toUpperCase()}
            </div>

            {showMenu && (
              <div className="user-menu">
                <button
                  className="user-menu-item"
                  onClick={() => navigate("/profile")}
                >
                  Ver Perfil
                </button>


                {/* 🔹 Solo los ADMIN ven la gestión */}
                {user?.role?.toUpperCase().includes("ADMIN") && (
                  <>
                    <button
                      className="user-menu-item"
                      onClick={() => navigate("/admin")}
                    >
                      Panel Admin
                    </button>
                    <button
                      className="user-menu-item"
                      onClick={() => navigate("/admin/usuarios")}
                    >
                      Gestionar Usuarios
                    </button>
                  </>
                )}


                <button
                  className="user-menu-item logout"
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
