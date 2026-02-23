// src/components/AdminUsersList/AdminUsersList.jsx
import React from "react";
import "./AdminUsersList.css";

export default function AdminUsersList({ usuarios, onEditRole, onDelete }) {
  if (!usuarios || usuarios.length === 0) return <p>No hay usuarios</p>;

  return (
    <div className="admin-users-container">
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Nombre</th>
            <th>Rol</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{u.firstName} {u.lastName}</td>
              <td className={u.role === "ROLE_ADMIN" ? "role-admin" : "role-user"}>
                {u.role.replace("ROLE_", "")}
              </td>
              <td>
                <button className="btn-edit" onClick={() => onEditRole(u)}>
                  Cambiar rol
                </button>
                <button className="btn-delete" onClick={() => onDelete(u.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
