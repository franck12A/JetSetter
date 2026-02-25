import React, { useEffect, useState } from "react";

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

  if (loading) return <p>Cargando vuelos...</p>;

  return (
    <div className="container py-5">
      <h2 className="text-center mb-4">✈️ Vuelos disponibles</h2>
      <div className="row g-4">
        {vuelos.map(vuelo => (
          <div key={vuelo.id} className="col-md-4">
            <div className="card shadow-sm">
              <img src={vuelo.imagenUrl} className="card-img-top" alt={vuelo.nombre} />
              <div className="card-body">
                <h5 className="card-title">{vuelo.nombre}</h5>
                <p className="card-text">Precio: ${vuelo.precio}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VuelosList;
