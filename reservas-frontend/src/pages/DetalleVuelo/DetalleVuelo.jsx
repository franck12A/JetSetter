import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { FaClock, FaMapMarkerAlt, FaPlaneDeparture, FaTicketAlt } from "react-icons/fa";

import productService from "../../services/productService";
import { getUserFavorites, addFavorite, removeFavorite } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import "./DetalleVuelo.css";

const parseRouteName = (name, fallbackCountry = "-") => {
  const raw = name || "";
  const parts = raw
    .split(/->|→|â†’|Ã¢â€ â€™/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    origen: parts[0] || raw || "-",
    destino: parts[1] || fallbackCountry || "-",
  };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const normalizeVuelo = (data) => {
  if (!data) return null;

  const segmentos = Array.isArray(data.segmentos) ? data.segmentos : [];
  const primerSegmento = segmentos[0] || {};
  const ultimoSegmento = segmentos[segmentos.length - 1] || {};
  const route = parseRouteName(data.name, data.country);

  const fechaSalidaRaw = data.fechaSalida || data.departureDate || primerSegmento.salida || null;
  const fechaLlegadaRaw = data.fechaLlegada || data.arrivalDate || ultimoSegmento.llegada || null;

  const caracteristicas = data.caracteristicas?.length
    ? data.caracteristicas
    : data.features?.map((f) => f.name).filter(Boolean) || [];

  const duracion = caracteristicas.find((c) => /duracion|duración/i.test(c)) || "Duracion: N/D";
  const clase = caracteristicas.find((c) => /clase/i.test(c)) || "Clase: N/D";
  const equipaje = caracteristicas.find((c) => /equipaje/i.test(c)) || "Equipaje: N/D";

  return {
    ...data,
    id: Number(data.id ?? data.productId ?? 0),
    aerolinea: data.aerolinea || primerSegmento.aerolinea || "Desconocida",
    numeroVuelo: data.numeroVuelo || primerSegmento.numeroVuelo || "000",
    origen: data.origen || route.origen,
    destino: data.destino || route.destino,
    paisDestino: data.paisDestino || data.country || route.destino || "-",
    segmentos,
    imagenPrincipal: data.imagenPrincipal || data.image || "/assets/default.jpg",
    precioTotal: data.precioTotal ?? data.price ?? 0,
    fechaSalidaRaw,
    fechaLlegadaRaw,
    fechaSalida: formatDateTime(fechaSalidaRaw),
    fechaLlegada: formatDateTime(fechaLlegadaRaw),
    duracion,
    clase,
    equipaje,
  };
};

export default function DetalleVuelo() {
  const { id } = useParams();
  const location = useLocation();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  const [vuelo, setVuelo] = useState(location.state?.vuelo ? normalizeVuelo(location.state.vuelo) : null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadVuelo = async () => {
      setLoading(true);
      let data = null;

      // Priorizamos endpoint de detalle porque trae informacion de vuelo enriquecida.
      try {
        data = await productService.obtenerVueloPorIdAPI(id);
      } catch {
        data = null;
      }

      if (!data) {
        try {
          data = await productService.getById(id);
        } catch {
          data = null;
        }
      }

      const normalizado = normalizeVuelo(data);
      if (normalizado) setVuelo(normalizado);
      setLoading(false);
    };

    loadVuelo();
  }, [id]);

  useEffect(() => {
    const loadFavs = async () => {
      if (!user || !vuelo?.id) return;
      try {
        const favs = await getUserFavorites();
        setIsFavorite(favs.some((f) => Number(f.id) === Number(vuelo.id)));
      } catch (err) {
        console.error("Error cargando favoritos:", err);
      }
    };

    loadFavs();
  }, [user, vuelo?.id]);

  const handleFavorite = async () => {
    if (!user || !vuelo?.id) return alert("Debes iniciar sesion para agregar favoritos");
    try {
      if (isFavorite) {
        await removeFavorite(vuelo.id);
        setIsFavorite(false);
      } else {
        await addFavorite(vuelo.id);
        setIsFavorite(true);
      }
    } catch (err) {
      alert("Error al actualizar favoritos");
      console.error(err);
    }
  };

  const handleBooking = async () => {
    if (!user || !vuelo?.id) return alert("Debes iniciar sesion para reservar");
    if (!vuelo.fechaSalidaRaw) return alert("No se puede reservar: fecha de salida no disponible");

    try {
      const booking = await createBooking({
        userId: user.id,
        productId: vuelo.id,
        dateStr: vuelo.fechaSalidaRaw,
        passengers: 1,
      });

      alert("Reserva realizada correctamente");
      setBookings((prev) => [...prev, booking]);
    } catch (err) {
      alert("Error al realizar la reserva");
      console.error(err);
    }
  };

  if (loading) return <p className="detalle-state">Cargando vuelo...</p>;
  if (!vuelo) return <p className="detalle-state">Vuelo no encontrado</p>;

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <div>
          <h1 className="detalle-title">{vuelo.origen} {"->"} {vuelo.destino}</h1>
          <p className="detalle-subtitle">{vuelo.aerolinea} | Vuelo {vuelo.numeroVuelo}</p>
        </div>
        <button className="btn-back" onClick={() => window.history.back()}>Volver</button>
      </div>

      <div className="detalle-main">
        <div className="galeria-principal">
          <img src={vuelo.imagenPrincipal} alt={vuelo.aerolinea} />
        </div>

        <div className="detalle-info">
          <div className="detalle-kpis">
            <div className="kpi-chip"><FaTicketAlt /> ${vuelo.precioTotal}</div>
            <div className="kpi-chip"><FaPlaneDeparture /> Salida: {vuelo.fechaSalida}</div>
            <div className="kpi-chip"><FaClock /> {vuelo.duracion}</div>
            <div className="kpi-chip"><FaMapMarkerAlt /> {vuelo.paisDestino}</div>
          </div>

          <div className="detalle-meta">
            <p><strong>{vuelo.clase}</strong></p>
            <p><strong>{vuelo.equipaje}</strong></p>
            <p><strong>Llegada:</strong> {vuelo.fechaLlegada}</p>
          </div>

          {vuelo.segmentos?.length > 0 && (
            <div className="detalle-segmentos">
              <h3>Itinerario</h3>
              {vuelo.segmentos.map((seg, idx) => (
                <div key={`${seg.numeroVuelo || idx}-${idx}`} className="segmento-item">
                  <div>
                    <p><strong>Tramo {idx + 1}</strong></p>
                    <p>{seg.aerolinea || "-"} #{seg.numeroVuelo || "-"}</p>
                  </div>
                  <div>
                    <p>Salida: {formatDateTime(seg.salida)}</p>
                    <p>Llegada: {formatDateTime(seg.llegada)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="detalle-actions">
            <button className="btn-primary" onClick={handleBooking}>Reservar</button>
            <button className="btn-fav" onClick={handleFavorite}>
              {isFavorite ? "Favorito" : "Agregar a favoritos"}
            </button>
          </div>

          {bookings.length > 0 && (
            <div className="detalle-bookings">
              <h3>Mis reservas de este vuelo</h3>
              <ul>
                {bookings.map((b) => (
                  <li key={b.id}>
                    Fecha: {new Date(b.bookingDate).toLocaleDateString("es-AR")} | Pasajeros: {b.passengers} | Estado: {b.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
