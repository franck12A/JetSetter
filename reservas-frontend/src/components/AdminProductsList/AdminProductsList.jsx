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
            <th>Nombre</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {safeVuelos.length > 0 ? (
            safeVuelos.map((prod, index) => (
              <tr key={`vuelo-${prod.id}-${index}`}>
                <td>{prod.id}</td>
                <td>{prod.name}</td>
                <td>
                  <button className="btn-edit" onClick={() => onEdit(prod)}>Editar</button>
                  <button className="btn-delete" onClick={() => onDelete(prod.id)}>Eliminar</button>
                  <Link className="btn-view" to={`/vuelo/${prod.id}`}>Ver</Link>
                </td>
              </tr>
            ))
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
