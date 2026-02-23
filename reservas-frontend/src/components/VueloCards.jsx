// VueloCard.jsx
import React from "react";
import { FaPlane } from "react-icons/fa";
import { getSafeIcon } from "../utils/iconRegistry"; // asegurate de tener esta función

export default function VueloCard({ vuelo, compact = false, miniCard = false, showImage = true, IconComponent }) {
  const esApi = !!vuelo.segmentos && vuelo.segmentos.length > 0;

  const primerSegmento = esApi ? vuelo.segmentos?.[0] || {} : {};
  const ultimoSegmento = esApi ? vuelo.segmentos?.[vuelo.segmentos.length - 1] || {} : {};

  const Icon = IconComponent || FaPlane;

  // Función para formatear fechas
const formatearFecha = (isoFecha) => {
  if (!isoFecha) return "-";
  const fecha = new Date(isoFecha);
  if (isNaN(fecha.getTime())) return "-"; // <-- valida fecha inválida
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
};


  // Normalizamos campos para que funcione con API y backend
  const fechaSalida = formatearFecha(vuelo.fechaSalida || vuelo.departureDate || primerSegmento.salida);
  const fechaLlegada = formatearFecha(vuelo.fechaLlegada || vuelo.arrivalDate || ultimoSegmento.llegada);

  const aerolinea = vuelo.aerolinea || primerSegmento.aerolinea || "Desconocida";
  const numeroVuelo = vuelo.numeroVuelo || primerSegmento.numeroVuelo || "000";
  const precio = vuelo.precioTotal || vuelo.price || 0;
  const origen = vuelo.origen || vuelo.name || "-";
  const destino = vuelo.destino || "-";
  const paisDestino = vuelo.paisDestino || vuelo.country || "-";

  // Modo mini tarjeta
  if (miniCard) {
    return (
      <div className="vuelo-card-mini">
        {showImage && (
          <img
            src={vuelo.imagenPrincipal || vuelo.image || "/assets/default.jpg"}
            alt={aerolinea}
            className="vuelo-card-mini-img"
          />
        )}
        <div className="vuelo-card-mini-info">
          <h4>{aerolinea} - {numeroVuelo}</h4>
          <p>${precio}</p>
          <div className="vuelo-caracteristicas-mini">
            {vuelo.caracteristicas?.slice(0,3).map((c,i) => {
              const IconF = getSafeIcon(c);
              return (
                <div key={i} className="feature-item-mini">
                  {IconF && <IconF size={16} className="feature-icon-mini" />}
                  <span>{c}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  // Vista compacta
  if (compact) {
    return (
      <div className="vuelo-card-compact">
        <div className="vuelo-icono">
          <Icon size={50} />
        </div>
        <h4>{esApi ? `${origen} → ${destino}` : origen}</h4>
        <p>{paisDestino}</p>
        <p>Salida: {fechaSalida}</p>
      </div>
    );
  }

  // Vista completa
  return (
    <div className="vuelo-card">
      {showImage && (
        <img
          src={vuelo.imagenPrincipal || vuelo.image || "/assets/default.jpg"}
          alt={aerolinea}
          className="vuelo-card-img"
        />
      )}

      <h3>{esApi ? `${origen} → ${destino}` : origen}</h3>
      <p>Aerolínea: {aerolinea}</p>
      <p>Número de vuelo: {numeroVuelo}</p>
      <p>Precio: ${precio}</p>
      <p>Duración: {vuelo.caracteristicas?.[0] || "-"}</p>
      <p>Clase: {vuelo.caracteristicas?.[1] || "-"}</p>
      <p>Equipaje: {vuelo.caracteristicas?.[2] || "-"}</p>
      <p>País destino: {paisDestino}</p>
      <p>Salida: {fechaSalida}</p>
      <p>Llegada: {fechaLlegada}</p>

      {vuelo.caracteristicas?.length > 0 && (
        <div className="vuelo-caracteristicas">
          {vuelo.caracteristicas.map((c, i) => {
            const IconFeature = getSafeIcon(c);
            return (
              <div key={i} className="feature-item">
                {IconFeature && <IconFeature size={20} className="feature-icon"/>}
                <span>{c}</span>
              </div>
            );
          })}
        </div>
      )}

      {!esApi && (
        <>
          <p>Descripción: {vuelo.description || "-"}</p>
          <p>Creado: {vuelo.createdAt || "-"}</p>
          <p>Actualizado: {vuelo.updatedAt || "-"}</p>
        </>
      )}
    </div>
  );
}
