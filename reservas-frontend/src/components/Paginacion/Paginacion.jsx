import React from "react";
import "./Paginacion.css";

export default function Paginacion({ totalItems, itemsPerPage, currentPage, setCurrentPage }) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleFirst = () => setCurrentPage(1);
  const handleLast = () => setCurrentPage(totalPages);

  return (
    <div className="paginacion-container">
      <button onClick={handleFirst} disabled={currentPage === 1}>Inicio</button>
      <button onClick={handlePrev} disabled={currentPage === 1}>Anterior</button>

      <span>{currentPage} / {totalPages}</span>

      <button onClick={handleNext} disabled={currentPage === totalPages}>Siguiente</button>
      <button onClick={handleLast} disabled={currentPage === totalPages}>Fin</button>
    </div>
  );
}
