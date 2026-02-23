// src/components/Galeria/Galeria.jsx
import React from "react";
import "./Galeria.css";

export default function Galeria({ imagenes = [], nombre }) {
  if (!imagenes.length) return <p>No hay imágenes disponibles.</p>;

  const principal = imagenes[0];
  const secundarias = imagenes.slice(1, 5);

  return (
    <div className="galeria-container">
      <div className="galeria-bloque">
        {/* Imagen principal */}
        <div className="galeria-principal">
          <img src={principal} alt={`${nombre} principal`} />
        </div>

        {/* Grilla de 4 imágenes */}
        <div className="galeria-grilla">
          {secundarias.map((img, i) => (
            <img key={i} src={img} alt={`${nombre} ${i + 2}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
