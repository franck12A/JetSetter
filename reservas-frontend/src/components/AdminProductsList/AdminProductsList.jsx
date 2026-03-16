import React from "react";
import { Link } from "react-router-dom";
import "./AdminProductsList.css";

export default function AdminProductsList({ vuelos, onEdit, onDelete }) {
  const safeVuelos = vuelos || [];

  return (
    <div className="admin-products-list">
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>FLIGHT NAME <span style={{fontSize:'0.65rem',color:'#64748b'}}>(Nombre)</span></th>
            <th>COUNTRY</th>
            <th>PRICE (USD)</th>
            <th>STATUS</th>
            <th style={{ textAlign: "right" }}>ACTIONS <span style={{fontSize:'0.65rem',color:'#64748b'}}>(Acciones)</span></th>
          </tr>
        </thead>
        <tbody>
          {safeVuelos.length > 0 ? (
            safeVuelos.map((prod, index) => {
              const isDraft = !prod.name || !prod.country || !prod.price || !prod.image;
              return (
                <tr key={`vuelo-${prod.id}-${index}`}>
                  <td className="admin-td-id">#{prod.id}</td>
                  <td className="admin-td-name">{prod.name || "Sin nombre"}</td>
                  <td className="admin-td-country">{prod.country || "-"}</td>
                  <td className="admin-td-price">${prod.price || "0.00"}</td>
                  <td className="admin-td-status">
                    <span className={`status-pill ${isDraft ? "draft" : "active"}`}>
                      {isDraft ? "DRAFT" : "ACTIVE"}
                    </span>
                  </td>
                  <td className="admin-td-actions">
                    <button className="icon-btn-action" onClick={() => onEdit(prod)} title="Editar">
                      ✎
                    </button>
                    <button className="icon-btn-action delete" onClick={() => onDelete(prod.id)} title="Eliminar">
                      🗑
                    </button>
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "1rem" }}>No hay productos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
