import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./GaleriaPage.css";

export default function GaleriaPage() {
  const { id } = useParams();
  const [imagenes, setImagenes] = useState([]);
  const [vuelo, setVuelo] = useState(null);


  

  return (
<div className="galeria-container">

  <div className="galeria-grid">

    {/* Imagen principal */}
    <div className="img-principal">
      <img src={imagenes[0]}  />
      <div className="destino-info">
        <span className="badge">MÁS POPULAR</span>
        <h3>por ahora nada</h3>
      </div>
    </div>

    {/* Imagen 2 */}
    <img src={imagenes[1]} alt="" className="img-sec" />

    {/* Imagen 3 */}
    <img src={imagenes[2]} alt="" className="img-sec" />

    {/* Imagen 4 */}
    <img src={imagenes[3]} alt="" className="img-sec" />

    {/* Imagen 5 con botón */}
    <div className="img-sec ver-mas">
      <img src={imagenes[4]} alt="" />
      <button className="btn-vermas">Ver más</button>
    </div>

  </div>

</div>
  );
}
