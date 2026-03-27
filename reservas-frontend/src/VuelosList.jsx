import React, { useEffect, useState } from "react";
import "./components/VuelosList/VuelosList.css";

function VuelosList() {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/api/products/random?count=6")
      .then(res => res.json())
      .then(data => {
        setVuelos(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="vuelos-list-loading">Cargando vuelos...</p>;

  return (
    <div className="vuelos-list">
      <h2 className="vuelos-list-title">✈️ Vuelos disponibles</h2>
      <div className="vuelos-list-grid">
        {vuelos.map(vuelo => (
          <div key={vuelo.id} className="vuelos-list-item">
            <div className="vuelos-list-card">
              <img src={vuelo.imagenUrl} className="vuelos-list-image" alt={vuelo.nombre} />
              <div className="vuelos-list-body">
                <h5 className="vuelos-list-name">{vuelo.nombre}</h5>
                <p className="vuelos-list-desc">Precio: ${vuelo.precio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VuelosList;
