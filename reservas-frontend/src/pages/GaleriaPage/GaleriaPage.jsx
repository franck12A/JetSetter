import React from "react";
import "./GaleriaPage.css";

export default function GaleriaPage() {
  const destinos = [
    {
      id: "tokio",
      titulo: "Tokio, Japon",
      imagen: "/assets/imagenespaises/japon_2.jpg",
      badge: "MAS POPULAR",
      destacado: true,
    },
    {
      id: "paris",
      titulo: "Paris, Francia",
      imagen: "/assets/imagenespaises/france_1.webp",
    },
    {
      id: "egeo",
      titulo: "Egeo, Grecia",
      imagen: "/assets/imagenespaises/grecia_1.jpg",
    },
    {
      id: "aurora",
      titulo: "Tromso, Noruega",
      imagen: "/assets/imagenespaises/Norway_1.jpg",
    },
    {
      id: "venecia",
      titulo: "Venecia, Italia",
      imagen: "/assets/imagenespaises/italy_2.jpg",
      cta: "Ver mas",
    },
  ];

  return (
    <section className="galeria-page">
      <div className="galeria-shell">
        <header className="galeria-header">
          <span className="galeria-kicker">
            <span className="galeria-dot" />
            Explora el mundo
          </span>
          <h1>Destinos Destacados</h1>
          <p>
            Descubre lugares increibles y planifica tu proxima aventura con
            nuestra seleccion curada de destinos populares.
          </p>
        </header>

        <div className="galeria-grid">
          {destinos.map((destino) => (
            <article
              key={destino.id}
              className={`galeria-card${destino.destacado ? " galeria-card--featured" : ""}${
                destino.cta ? " galeria-card--cta" : ""
              }`}
            >
              <img src={destino.imagen} alt={destino.titulo} />
              {destino.destacado && (
                <div className="galeria-overlay">
                  <span className="galeria-badge">{destino.badge}</span>
                  <h3>{destino.titulo}</h3>
                </div>
              )}
              {destino.cta && (
                <button type="button" className="galeria-btn">
                  {destino.cta}
                </button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
