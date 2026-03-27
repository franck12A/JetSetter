// src/components/CarruselMini/CarruselMini.jsx
import React from "react";
import "./CarruselMini.css";
export default function CarruselMini({ activeIndex, setActiveIndex, vuelos = [] }) {
  if (!vuelos || vuelos.length === 0) {
    return <p>No hay vuelos disponibles.</p>;
  }

  const nextSlide = () => setActiveIndex((prev) => (prev + 1) % vuelos.length);
  const prevSlide = () => setActiveIndex((prev) => (prev - 1 + vuelos.length) % vuelos.length);

  return (
    <section className="carrusel-mini">
      <button className="carrusel-prev" onClick={prevSlide}>&lt;</button>

      <div
        className="carrusel-mini-inner"
        style={{ transform: `translateX(-${220 * activeIndex}px)` }}
      >
        {vuelos.map((vuelo, i) => (
          <div
            key={vuelo.id}
            className={`carrusel-mini-item ${i === activeIndex ? "active" : ""}`}
          >
            <img src={vuelo.img} alt={vuelo.nombre} className="carrusel-mini-image" />
            <div className="carrusel-mini-info">
              <h4 className="carrusel-mini-title">{vuelo.nombre}</h4>
              <p className="carrusel-mini-price">{vuelo.precio}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="carrusel-next" onClick={nextSlide}>&gt;</button>

      <div className="carrusel-indicators">
        {vuelos.map((_, i) => (
          <span
            key={i}
            className={`carrusel-dot ${i === activeIndex ? "is-active" : ""}`}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
