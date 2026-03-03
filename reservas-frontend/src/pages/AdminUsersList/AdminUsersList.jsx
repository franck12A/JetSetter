// src/pages/AdminUsersList/AdminUsersList.jsx
import React from "react";
import "./AdminUsersList.css";
import { FaUserLock, FaRegTrashAlt } from "react-icons/fa";

export default function AdminUsersList({ usuarios, onEditRole, onDelete }) {
  if (!usuarios || usuarios.length === 0) return <p className="au-empty">No hay usuarios</p>;

  // Función para obtener color de avatar según letra
  const getAvatarColor = (char) => {
    const code = char.charCodeAt(0) % 3;
    if (code === 0) return { bg: "#0f172a", text: "#38bdf8" }; // Cian
    if (code === 1) return { bg: "#0f172a", text: "#a78bfa" }; // Púrpura
    return { bg: "#0f172a", text: "#4ade80" }; // Verde
  };

  return (
    <div className="au-list">
      {usuarios.map((u) => {
        const isAdmin = u.role === "ROLE_ADMIN";
        const isEditor = u.role === "ROLE_EDITOR";
        const initials = getInitials(u.firstName, u.lastName);
        const avatarColors = getAvatarColor(initials.charAt(0) || "U");

        return (
          <div className="au-card" key={u.id}>

            <div className="au-card-left">
              <div className="au-avatar-info-row">
                <div
                  className="au-avatar"
                  style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}
                >
                  {initials}
                </div>
                <div className="au-info">
                  <h3>{u.firstName} {u.lastName}</h3>
                  <p>{u.email}</p>
                </div>
              </div>
              <span className="au-id">ID: {u.id}</span>
            </div>

            <div className="au-card-right">
              <span className={`au-role ${isAdmin ? 'au-role-admin' : isEditor ? 'au-role-editor' : 'au-role-user'}`}>
                {u.role.replace("ROLE_", "")}
              </span>

              <div className="au-actions">
                <button className="au-btn-role" onClick={() => onEditRole(u)}>
                  <FaUserLock style={{ marginRight: '6px' }} /> Cambiar Rol
                </button>
                <button className="au-btn-delete" onClick={() => onDelete(u.id)}>
                  <FaRegTrashAlt />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
