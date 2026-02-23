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
    <section className="carrusel-mini relative">
      <button className="carrusel-prev" onClick={prevSlide}>&lt;</button>

      <div
        className="carrusel-mini-inner flex transition-transform"
        style={{ transform: `translateX(-${220 * activeIndex}px)` }}
      >
        {vuelos.map((vuelo, i) => (
          <div
            key={vuelo.id}
            className={`carrusel-mini-item ${i === activeIndex ? "active" : ""} flex flex-col items-center`}
          >
            <img src={vuelo.img} alt={vuelo.nombre} className="rounded-lg" />
            <div className="info text-center mt-2">
              <h4 className="font-semibold">{vuelo.nombre}</h4>
              <p className="precio text-blue-600">{vuelo.precio}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="carrusel-next" onClick={nextSlide}>&gt;</button>

      <div className="carrusel-indicators flex justify-center mt-4 gap-2">
        {vuelos.map((_, i) => (
          <span
            key={i}
            className={`carrusel-dot w-3 h-3 rounded-full cursor-pointer ${i === activeIndex ? "bg-blue-600" : "bg-gray-300"}`}
            onClick={() => setActiveIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
