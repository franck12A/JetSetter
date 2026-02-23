import React, { useState } from "react";
import "./ModalChangeRole.css";

export default function ModalChangeRole({ user, onClose, onSave }) {
  const [selectedRole, setSelectedRole] = useState(user.role || "user");

  const handleSave = () => {
    onSave(selectedRole);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Cambiar rol de {user.name}</h2>

        <label>
          Rol
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
          >
            <option value="user">Usuario</option>
            <option value="admin">Admin</option>
          </select>
        </label>

        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
