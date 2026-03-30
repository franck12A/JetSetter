import React, { useEffect, useState } from "react";
import "./AdminUsersList.css";
import { FaRegTrashAlt } from "react-icons/fa";

function getInitials(firstName, lastName, username) {
  const first = (firstName || "").trim();
  const last = (lastName || "").trim();

  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "U";
  }

  return (username || "U").slice(0, 2).toUpperCase();
}

export default function AdminUsersList({
  usuarios,
  onSaveRole,
  onDelete,
  savingRoleId,
  deletingUserId,
  currentUserId,
}) {
  const [draftRoles, setDraftRoles] = useState({});

  useEffect(() => {
    const nextDrafts = {};
    (usuarios || []).forEach((user) => {
      nextDrafts[user.id] = user.role || "ROLE_USER";
    });
    setDraftRoles(nextDrafts);
  }, [usuarios]);

  if (!usuarios || usuarios.length === 0) return <p className="au-empty">No hay usuarios</p>;

  const getAvatarColor = (char) => {
    const code = char.charCodeAt(0) % 3;
    if (code === 0) return { bg: "#0f172a", text: "#38bdf8" };
    if (code === 1) return { bg: "#0f172a", text: "#a78bfa" };
    return { bg: "#0f172a", text: "#4ade80" };
  };

  return (
    <div className="au-list">
      {usuarios.map((user) => {
        const isAdmin = user.role === "ROLE_ADMIN";
        const initials = getInitials(user.firstName, user.lastName, user.username);
        const avatarColors = getAvatarColor(initials.charAt(0) || "U");
        const draftRole = draftRoles[user.id] || user.role || "ROLE_USER";
        const roleChanged = draftRole !== user.role;
        const isProtected = user.email === "admin@vuelos.com" || user.email === "admin@miapp.test" || user.id === currentUserId;

        return (
          <div className="au-card" key={user.id ?? `${user.email}-${user.username}`}>
            <div className="au-card-left">
              <div className="au-avatar-info-row">
                <div className="au-avatar" style={{ backgroundColor: avatarColors.bg, color: avatarColors.text }}>
                  {initials}
                </div>
                <div className="au-info">
                  <h3>{user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "Usuario"}</h3>
                  <p>{user.email || "sin correo"}</p>
                </div>
              </div>
              <span className="au-id">ID: {user.id ?? "-"}</span>
            </div>

            <div className="au-card-right">
              <span className={`au-role ${isAdmin ? "au-role-admin" : "au-role-user"}`}>
                {(user.role || "ROLE_USER").replace("ROLE_", "")}
              </span>

              <div className="au-role-editor-box">
                <label className="au-role-label" htmlFor={`role-${user.id}`}>Rol</label>
                <select
                  id={`role-${user.id}`}
                  className="au-role-select"
                  value={draftRole}
                  disabled={isProtected || savingRoleId === user.id}
                  onChange={(event) => setDraftRoles((prev) => ({ ...prev, [user.id]: event.target.value }))}
                >
                  <option value="ROLE_USER">Usuario</option>
                  <option value="ROLE_ADMIN">Administrador</option>
                </select>
                <button
                  className="au-btn-role"
                  type="button"
                  disabled={isProtected || !roleChanged || savingRoleId === user.id}
                  onClick={() => onSaveRole?.(user, draftRole)}
                >
                  {savingRoleId === user.id ? "Guardando..." : "Guardar cambios"}
                </button>
                {isProtected && <span className="au-role-note">Usuario protegido</span>}
              </div>

              <div className="au-actions">
                <button
                  className="au-btn-delete"
                  type="button"
                  onClick={() => onDelete?.(user.id)}
                  disabled={isProtected || deletingUserId === user.id}
                >
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
