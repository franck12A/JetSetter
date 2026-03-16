// src/components/Navbar/Navbar.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { FaRegBell } from "react-icons/fa";
import { isAdminSession } from "../../utils/authRoles";
import "./Navbar.css";

export default function Navbar() {
  const { user, token, logout } = useContext(AuthContext);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const toggleMenu = () => setShowMenu(!showMenu);
  const isAdmin = isAdminSession(user, token || localStorage.getItem("token"));

  return (
    <header className="navbar">
      <div className="navbar-left" onClick={() => navigate("/")}>
        <div className="navbar-logo">
          <img src="/assets/logoJettSeter.png" alt="logo" className="logo-header" />
          <span className="navbar-lema">Tu próximo destino empieza acá.</span>
        </div>
      </div>

      <div className="navbar-right">
        {!user ? (
          <>
            <button className="btn-signup" onClick={() => navigate("/register")}>
              Crear Cuenta
            </button>
            <button className="btn-login" onClick={() => navigate("/login")}>
              Iniciar Sesion
            </button>
          </>
        ) : (
          <div className="navbar-user">
            <FaRegBell className="navbar-bell-icon" />
            <div className="user-avatar" onClick={toggleMenu} title="Menu de usuario">
              {user.firstName?.[0]?.toUpperCase()}
              {user.lastName?.[0]?.toUpperCase()}
            </div>

            {showMenu && (
              <div className="user-menu">
                <button className="user-menu-item" onClick={() => navigate("/profile")}>
                  Ver Perfil
                </button>

                {isAdmin && (
                  <>
                    <button className="user-menu-item" onClick={() => navigate("/administracion")}>
                      Panel Admin
                    </button>
                    <button className="user-menu-item" onClick={() => navigate("/administracion/usuarios")}>
                      Gestionar Usuarios
                    </button>
                  </>
                )}

                <button className="user-menu-item logout user-menu-logout" onClick={handleLogout}>
                  Cerrar Sesion
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
