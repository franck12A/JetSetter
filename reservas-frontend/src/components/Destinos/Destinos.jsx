import React from "react";
import { Link } from "react-router-dom";
import "./Destinos.css";

/**
 * Carrusel horizontal simple: overflow-x + cards
 * usa vuelo.id como key (debe ser único)
 */
export default function Destinos({ vuelos = [], loading = false }) {
  if (loading) return <p className="destinos-loading">Cargando destinos...</p>;
  if (!vuelos || vuelos.length === 0) return null;

  return (
    <section className="destinos-section">
      <h3 className="destinos-title">Destinos recomendados</h3>
      <div className="destinos-row">
        {vuelos.map((v) => (
          <Link
            key={String(v.id)}
            to={`/vuelo/${v.id}`}
            className="destino-card"
          >
            <img src={v.image} alt={v.name} className="destino-card-image" />
            <div className="destino-card-body">
              <h4 className="destino-card-title">{v.name}</h4>
              <p className="destino-card-country">{v.country}</p>
              <p className="destino-card-price">${v.price}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
