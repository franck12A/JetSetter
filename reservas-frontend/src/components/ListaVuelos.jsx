// src/components/ListaVuelos.jsx
import React, { useEffect, useState } from "react";
import { obtenerVuelos } from "../services/vuelosApi";

const ListaVuelos = ({ origen, destino, fecha }) => {
  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVuelos = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await obtenerVuelos(origen, destino, fecha, 20);
        setVuelos(data);
      } catch (err) {
        setError("Error al cargar los vuelos");
      } finally {
        setLoading(false);
      }
    };

    if (origen && destino && fecha) {
      fetchVuelos();
    }
  }, [origen, destino, fecha]);

  if (loading) return <p>Cargando vuelos...</p>;
  if (error) return <p>{error}</p>;
  if (!vuelos.length) return <p>No se encontraron vuelos</p>;

  return (
    <div>
      {vuelos.map((vuelo) => (
        <div key={vuelo.id} style={{ border: "1px solid #ccc", margin: "10px", padding: "10px" }}>
          <img
            src={vuelo.imagenPrincipal || "/assets/default.jpg"}
            alt={vuelo.destino}
            style={{ width: "100px", height: "auto" }}
          />
          <h3>
            {vuelo.origen} → {vuelo.destino}
          </h3>
          <p>Aerolínea: {vuelo.aerolinea}</p>
          <p>Número de vuelo: {vuelo.numeroVuelo}</p>
          <p>Precio: ${vuelo.precioTotal}</p>
          <p>Categorías: {vuelo.categorias.join(", ")}</p>
          <ul>
            {vuelo.caracteristicas.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          <div>
            <h4>Segmentos:</h4>
            {vuelo.segmentos.map((s, i) => (
              <div key={i}>
                <p>
                  {s.aerolinea} {s.numeroVuelo} | Salida: {s.salida} | Llegada: {s.llegada}
                </p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ListaVuelos;
