import React from "react";
import "./AdminProductsList.css";

const normalizeStatus = (status) => (String(status || "").trim().toUpperCase() === "ACTIVE" ? "ACTIVE" : "DRAFT");

export default function AdminProductsList({ vuelos, onEdit, onDelete, onToggleStatus, statusUpdatingId }) {
  const safeVuelos = vuelos || [];

  return (
    <div className="admin-products-list">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vuelo</th>
            <th>Destino</th>
            <th>Precio</th>
            <th>Estado</th>
            <th style={{ textAlign: "right" }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {safeVuelos.length > 0 ? (
            safeVuelos.map((product, index) => {
              const status = normalizeStatus(product.status);
              const isDraft = status === "DRAFT";
              return (
                <tr key={`vuelo-${product.id}-${index}`}>
                  <td className="admin-td-id">#{product.id}</td>
                  <td className="admin-td-name">{product.name || "Sin nombre"}</td>
                  <td className="admin-td-country">{product.country || "-"}</td>
                  <td className="admin-td-price">${product.price || "0.00"}</td>
                  <td className="admin-td-status">
                    <span className={`status-pill ${isDraft ? "draft" : "active"}`}>{isDraft ? "Borrador" : "Activo"}</span>
                  </td>
                  <td className="admin-td-actions">
                    <button
                      className="status-toggle-btn"
                      type="button"
                      onClick={() => onToggleStatus?.(product)}
                      disabled={statusUpdatingId === product.id}
                    >
                      {statusUpdatingId === product.id ? "Actualizando..." : isDraft ? "Publicar" : "Pausar (Borrador)"}
                    </button>
                    <button className="icon-btn-action" onClick={() => onEdit?.(product)} title="Editar" type="button">
                      Editar
                    </button>
                    <button className="icon-btn-action delete" onClick={() => onDelete?.(product.id)} title="Eliminar" type="button">
                      Eliminar
                    </button>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: "center", padding: "1rem" }}>No hay productos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
