import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { FaChevronLeft, FaRegCalendarAlt, FaRegClock, FaMoneyBillWave, FaPlane, FaRegHeart, FaHeart, FaInfoCircle } from "react-icons/fa";

import productService from "../../services/productService";
import { getUserFavorites, addFavorite, removeFavorite } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import { getVueloImage } from "../../utils/images";
import "./DetalleVuelo.css";
import Recomendaciones from "../../components/Recomendaciones/Recomendaciones";


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
  const rawProductId = data.productId ?? data.id;
  const parsedProductId = Number(rawProductId);
  const localProductId = Number.isInteger(parsedProductId) && parsedProductId > 0
    ? parsedProductId
    : null;

  return {
    ...data,
    id: data.id ?? data.productId ?? null,
    localProductId,
    aerolinea: data.aerolinea || primerSegmento.aerolinea || "Desconocida",
    numeroVuelo: data.numeroVuelo || primerSegmento.numeroVuelo || "000",
    origen: data.origen || route.origen,
    destino: data.destino || route.destino,
    paisDestino: data.paisDestino || data.country || route.destino || "-",
    segmentos,
    imagenPrincipal: getVueloImage(data),
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
  const navigate = useNavigate();
  const user = useMemo(() => JSON.parse(localStorage.getItem("user")), []);

  const [vuelo, setVuelo] = useState(location.state?.vuelo ? normalizeVuelo(location.state.vuelo) : null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadVuelo = async () => {
      setLoading(true);
      let data = null;
      const stateVuelo = location.state?.vuelo || null;
      const stateLocalId = Number(stateVuelo?.productId ?? stateVuelo?.id);
      const detailId = Number(id);

      // 1) Priorizar producto local (BD) para respetar imagen/campos editados en admin.
      const localIdCandidate = Number.isInteger(stateLocalId) && stateLocalId > 0
        ? stateLocalId
        : (Number.isInteger(detailId) && detailId > 0 ? detailId : null);

      if (localIdCandidate) {
        try {
          data = await productService.getById(localIdCandidate);
        } catch {
          data = null;
        }
      }

      // 2) Si no existe en BD, fallback a endpoint Amadeus.
      if (!data) {
        try {
          data = await productService.obtenerVueloPorIdAPI(id);
        } catch {
          data = null;
        }
      }

      // 3) Ultimo fallback: lo que venia por navigation state.
      if (!data && stateVuelo) {
        data = stateVuelo;
      }

      const normalizado = normalizeVuelo(data);
      if (normalizado) setVuelo(normalizado);
      setLoading(false);
    };

    loadVuelo();
  }, [id, location.state]);

  useEffect(() => {
    const loadFavs = async () => {
      if (!user || !vuelo?.localProductId) return;
      try {
        const favs = await getUserFavorites();
        setIsFavorite(favs.some((f) => Number(f.id) === Number(vuelo.localProductId)));
      } catch (err) {
        console.error("Error cargando favoritos:", err);
      }
    };

    loadFavs();
  }, [user, vuelo?.localProductId]);

  const handleFavorite = async () => {
    if (!user) return alert("Debes iniciar sesion para agregar favoritos");
    if (!vuelo?.localProductId) return alert("Este vuelo de Amadeus no esta guardado en la BD.");
    try {
      if (isFavorite) {
        await removeFavorite(vuelo.localProductId);
        setIsFavorite(false);
      } else {
        await addFavorite(vuelo.localProductId);
        setIsFavorite(true);
      }
    } catch (err) {
      alert("Error al actualizar favoritos");
      console.error(err);
    }
  };

  const handleBooking = async () => {
    if (!user) return alert("Debes iniciar sesion para reservar");
    if (!vuelo?.localProductId) return alert("Este vuelo de Amadeus no esta guardado en la BD.");
    if (!vuelo.fechaSalidaRaw) return alert("No se puede reservar: fecha de salida no disponible");

    try {
      const booking = await createBooking({
        userId: user.id,
        productId: vuelo.localProductId,
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
    <div className="detalle-page-container">
      <div className="detalle-card-wrapper">

        {/* HEADER: Volver + Titulo */}
        <div className="dv-header">
          <div className="dv-left-actions">
            <Link to="/" className="dv-home-logo-link" aria-label="Ir al inicio">
              <img src="/assets/logoJettSeter.png" alt="JetSetter" className="dv-home-logo" />
            </Link>
            <button className="dv-back-btn" onClick={() => navigate(-1)}>
              <FaChevronLeft />
            </button>
          </div>
          <div className="dv-title-center">
            <h1>{vuelo.origen} → {vuelo.destino}</h1>
            <p>{vuelo.aerolinea} | VUELO {vuelo.numeroVuelo}</p>
          </div>
          <button className="dv-top-volver-texto" onClick={() => navigate(-1)}>Volver</button>
        </div>

        <div className="dv-content-split">

          {/* LADO IZQ: IMAGEN */}
          <div className="dv-image-side">
            <img src={getVueloImage(vuelo)} alt={`Destino ${vuelo.destino}`} />
          </div>

          {/* LADO DER: INFO */}
          <div className="dv-info-side">

            {/* KPI Rows */}
            <div className="dv-kpi-row">
              <div className="dv-kpi-icon-container"><FaMoneyBillWave /></div>
              <div className="dv-kpi-text">
                <span>PRECIO</span>
                <strong>${vuelo.precioTotal}</strong>
              </div>
            </div>

            <div className="dv-kpi-row">
              <div className="dv-kpi-icon-container"><FaRegCalendarAlt /></div>
              <div className="dv-kpi-text">
                <span>FECHA</span>
                <strong>{vuelo.fechaSalidaRaw ? new Date(vuelo.fechaSalidaRaw).toLocaleDateString("es-AR", { day: '2-digit', month: 'short', year: 'numeric' }) : vuelo.fechaSalida}</strong>
              </div>
            </div>

            <div className="dv-kpi-row">
              <div className="dv-kpi-icon-container"><FaRegClock /></div>
              <div className="dv-kpi-text">
                <span>DURACIÓN</span>
                <strong>{vuelo.duracion.replace("Duracion:", "").trim()}</strong>
              </div>
            </div>

            {/* Clase & Equipaje */}
            <div className="dv-class-section">
              <div className="dv-class-header">
                <span className="dv-subtitle">CLASE & EQUIPAJE</span>
                <span className="dv-badge-danger">SIN MALETA</span>
              </div>
              <h4>{vuelo.clase.replace("Clase:", "").trim() || "Tarifa Economy"}</h4>
              <p className="dv-class-hint"><FaInfoCircle /> Solo incluye artículo personal debajo del asiento.</p>
            </div>

            {/* Itinerario Timeline */}
            <div className="dv-itinerary-section">
              <span className="dv-subtitle">ITINERARIO</span>

              <div className="dv-timeline">
                {/* Punto Salida */}
                <div className="dv-tl-item">
                  <div className="dv-tl-dot start-dot"></div>
                  <div className="dv-tl-content">
                    <div className="dv-tl-header">
                      <strong>Salida {vuelo.origen}</strong>
                      <span className="dv-tl-time">{vuelo.fechaSalida.split(" ")[1] || "00:00"}</span>
                    </div>
                    <p className="dv-tl-sub">{vuelo.origen} Airport</p>
                  </div>
                </div>

                {/* Info Vuelo del medio */}
                <div className="dv-tl-flight-info">
                  <div className="dv-tl-line"></div>
                  <div className="dv-tl-flight-card">
                    <FaPlane className="dv-flight-icon" />
                    <span>{vuelo.aerolinea} #{vuelo.numeroVuelo}</span>
                    <span className="dv-tl-confirmed">CONFIRMADO</span>
                  </div>
                </div>

                {/* Punto Llegada */}
                <div className="dv-tl-item">
                  <div className="dv-tl-dot end-dot"></div>
                  <div className="dv-tl-content">
                    <div className="dv-tl-header">
                      <strong>Llegada {vuelo.destino}</strong>
                      <span className="dv-tl-time">{vuelo.fechaLlegada.split(" ")[1] || "00:00"}</span>
                    </div>
                    <p className="dv-tl-sub">{vuelo.paisDestino} Intl Airport</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="dv-action-buttons">
              <button className="dv-btn-reservar" onClick={handleBooking}>
                Reservar ahora
              </button>
              <button className="dv-btn-favorito" onClick={handleFavorite}>
                {isFavorite ? <FaHeart className="fav-active" /> : <FaRegHeart />}
                {isFavorite ? "En favoritos" : "Agregar a favoritos"}
              </button>
            </div>

          </div>
        </div>
      </div>

    </div>
  );
}
