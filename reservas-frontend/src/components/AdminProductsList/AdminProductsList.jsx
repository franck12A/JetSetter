import React from "react";
import { Link } from "react-router-dom";
import "./AdminProductsList.css";

export default function AdminProductsList({ vuelos, onEdit, onDelete, page, setPage, perPage }) {
const safeVuelos = vuelos || [];
const totalPages = Math.ceil(safeVuelos.length / perPage);
const paginatedProducts = safeVuelos.slice((page - 1) * perPage, page * perPage);

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
  {paginatedProducts.length > 0 ? (
    paginatedProducts.map((prod, index) => (
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

      {totalPages > 1 && (
        <div className="admin-products-pagination">
          <button onClick={() => setPage(1)} disabled={page === 1}>Inicio</button>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</button>
          <span>{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Siguiente →</button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>Fin</button>
        </div>
      )}
    </div>
  );
}
