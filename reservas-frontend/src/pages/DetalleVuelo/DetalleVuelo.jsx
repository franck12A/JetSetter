import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaChevronLeft, FaRegCalendarAlt, FaRegClock, FaMoneyBillWave, FaPlane, FaRegHeart, FaHeart, FaInfoCircle } from "react-icons/fa";

import productService from "../../services/productService";
import { getUserFavorites, addFavorite, removeFavorite } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import { getVueloImage } from "../../utils/images";
import { getSafeIcon } from "../../utils/iconRegistry";
import "./DetalleVuelo.css";
import Galeria from "../../components/Galeria/Galeria";
import { Link } from "react-router-dom";

const parseRouteName = (name, fallbackCountry = "-") => {
  const raw = name || "";
  const parts = raw
    .split(/->|â†’|Ã¢â€ â€™|ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢/)
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

  const parsedCaracteristicas = caracteristicas
    .map((item) => String(item || "").split(":"))
    .map(([key, ...rest]) => ({
      key: key ? key.trim().toLowerCase() : "",
      value: rest.join(":").trim(),
    }))
    .filter((item) => item.key && item.value);

  const getFeatureValue = (patterns) => {
    const entry = parsedCaracteristicas.find((item) =>
      patterns.some((p) => p.test(item.key))
    );
    return entry?.value || "";
  };

  const duracion = data?.duracion || getFeatureValue([/duracion/i, /duraci\\u00f3n/i]) || "Consultar";
  const clase = data?.clase || getFeatureValue([/clase/i]) || "Economica";
  const equipaje = data?.equipaje || getFeatureValue([/equipaje/i, /maleta/i, /bag/i]) || "No incluido";
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
  const featureItems = useMemo(() => {
    if (!vuelo) return [];
    const fromFeatures = Array.isArray(vuelo.features) ? vuelo.features : [];
    if (fromFeatures.length > 0) {
      return fromFeatures
        .filter((f) => f?.name)
        .map((f) => ({
          label: String(f.name),
          iconName: f.icon || f.name,
        }));
    }

    const rawList = Array.isArray(vuelo.caracteristicas) ? vuelo.caracteristicas : [];
    return rawList
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .map((label) => ({ label, iconName: label }));
  }, [vuelo]);
  const imageList = useMemo(() => {
    if (!vuelo) return [];
    const items = [];
    const pushUnique = (src) => {
      if (!src) return;
      if (!items.includes(src)) items.push(src);
    };
    if (Array.isArray(vuelo.imagesBase64)) {
      vuelo.imagesBase64.forEach(pushUnique);
    }
    if (Array.isArray(vuelo.imagenesPais)) {
      vuelo.imagenesPais.forEach(pushUnique);
    }
    pushUnique(vuelo.imagenPrincipal);
    return items;
  }, [vuelo]);

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
      <header className="detalle-header-bar">
        <div className="detalle-header-inner">
          <div className="dv-header-left">
            <h1 className="dv-header-title">Vuelo a {vuelo.destino}</h1>
            <p className="dv-header-subtitle">{vuelo.aerolinea} | VUELO {vuelo.numeroVuelo}</p>
          </div>
          <button className="dv-back-btn dv-back-right" onClick={() => navigate(-1)} aria-label="Volver">
            <FaChevronLeft />
          </button>
        </div>
      </header>

      <div className="detalle-card-wrapper">
        <section className="dv-hero">
          <div className="dv-hero-media">
            <div className="dv-hero-image">
              <img src={getVueloImage(vuelo)} alt={`Destino ${vuelo.destino}`} />
              <div className="dv-hero-overlay">
                <span className="dv-hero-badge">DESTINO PREMIUM</span>
                <h2 className="dv-hero-title">{vuelo.destino}</h2>
              </div>
            </div>

            {imageList.length > 1 && (
              <div className="dv-thumb-row">
                {imageList.slice(0, 4).map((src, index) => (
                  <img key={`${index}-${src}`} src={src} alt={`Vista ${index + 1}`} className="dv-thumb" />
                ))}
              </div>
            )}
          </div>

          <div className="dv-hero-side">
            <div className="dv-meta">
              <div className="dv-route-block">
                <span className="dv-country">{vuelo.paisDestino || "Destino"}</span>
                <h2 className="dv-route-title">{vuelo.origen} - {vuelo.destino}</h2>
                <p className="dv-route-sub">{vuelo.aerolinea} · {vuelo.numeroVuelo}</p>
              </div>
              <button
                className={`dv-icon-btn ${isFavorite ? "is-active" : ""}`}
                onClick={handleFavorite}
                aria-label={isFavorite ? "Quitar favorito" : "Agregar favorito"}
              >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            <div className="dv-description">
              <h3>Descripcion</h3>
              <p>{vuelo.descripcion || vuelo.description || "Descubre la magia, cultura y gastronomía de este increíble destino garantizando una experiencia inolvidable. ¡Reserva tu vuelo hoy mismo!"}</p>
            </div>

            {featureItems.length > 0 && (
              <div className="dv-features-block">
                <h3>Caracteristicas</h3>
                <div className="dv-features-grid">
                  {featureItems.map((feat, index) => {
                    const Icon = getSafeIcon(feat.iconName);
                    return (
                      <div key={`${feat.label}-${index}`} className="dv-feature-item">
                        <span className="dv-feature-icon">{Icon ? <Icon /> : null}</span>
                        <span className="dv-feature-text">{feat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="dv-class-section">
              <div className="dv-class-header">
                <span className="dv-subtitle">CARACTERISTICAS</span>
                <span className="dv-badge-danger">SIN MALETA</span>
              </div>
              <h4>{vuelo.clase.replace("Clase:", "").trim() || "Tarifa Economy"}</h4>
              <p className="dv-class-hint"><FaInfoCircle /> Solo incluye articulo personal debajo del asiento.</p>
            </div>

            <div className="dv-price-bar">
              <div className="dv-price-info">
                <span>Desde</span>
                <strong>${vuelo.precioTotal}</strong>
                <em>por persona</em>
              </div>
              <button className="dv-btn-reservar" onClick={handleBooking}>
                Reservar ahora
              </button>
            </div>

            <div className="dv-stats-grid">
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
                  <span>DURACION</span>
                  <strong>{vuelo.duracion.replace("Duracion:", "").trim()}</strong>
                </div>
              </div>

              <div className="dv-kpi-row">
                <div className="dv-kpi-icon-container"><FaPlane /></div>
                <div className="dv-kpi-text">
                  <span>CLASE</span>
                  <strong>{vuelo.clase.replace("Clase:", "").trim() || "Consultar"}</strong>
                </div>
              </div>

              <div className="dv-kpi-row">
                <div className="dv-kpi-icon-container"><FaInfoCircle /></div>
                <div className="dv-kpi-text">
                  <span>EQUIPAJE</span>
                  <strong>{vuelo.equipaje.replace("Equipaje:", "").trim() || "Consultar"}</strong>
                </div>
              </div>
            </div>
            
            <Link to={`/galeria/${vuelo.id}`} className="dv-btn-galeria-wide">
              Ver galería de imágenes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
















