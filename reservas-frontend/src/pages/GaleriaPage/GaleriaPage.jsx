import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./GaleriaPage.css";

export default function GaleriaPage() {
  const { id } = useParams();
  const [imagenes, setImagenes] = useState([]);
  const [vuelo, setVuelo] = useState(null);

useEffect(() => {
  const fetchGaleria = async () => {
    try {
      console.log("➡️ Fetch galería para vuelo ID:", id);
      const res = await fetch(`http://localhost:8080/api/vuelos/${id}`);
      console.log("🟦 Response status:", res.status);

      if (!res.ok) throw new Error(`Vuelo no encontrado (status ${res.status})`);
      const data = await res.json();
      console.log("🟩 Vuelo recibido:", data);

      setVuelo(data);
      setImagenes(data.imagenesUrls || []);
    } catch (err) {
      console.error("❌ Error cargando galería:", err);
    }
  };

  fetchGaleria();
}, [id]);


  if (!vuelo) return <p>Vuelo no encontrado</p>;

  return (
    <div className="galeria-page container">
<h2>Galería de {vuelo.destino}</h2>
{imagenes.length === 0 ? (
  <p>No hay imágenes disponibles</p>
) : (
  <div className="galeria-grid">
    {imagenes.map((img, i) => (
      <img key={i} src={img} alt={vuelo.destino} className="galeria-img" />
    ))}
  </div>
)}
<Link to={`/vuelo/${id}`} className="btn-back mt-3">← Volver al detalle</Link>

    </div>
  );
}
