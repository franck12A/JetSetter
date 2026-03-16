import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaChevronLeft,
  FaRegClock,
  FaMoneyBillWave,
  FaPlane,
  FaRegHeart,
  FaHeart,
  FaSuitcaseRolling,
  FaMapSigns,
  FaRoute,
  FaPlaneDeparture,
  FaPlaneArrival,
  FaTicketAlt,
  FaWifi,
  FaUtensils,
  FaChair,
  FaShieldAlt,
  FaExchangeAlt,
  FaPlug,
} from "react-icons/fa";

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

const normalizeText = (value) => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim();

const FEATURE_LABEL_MAP = [
  { match: /duracion|tiempo|hora/, label: "Duracion" },
  { match: /clase|cabina/, label: "Clase" },
  { match: /equipaje|maleta|bag|carry/, label: "Equipaje" },
  { match: /aerolinea|airline/, label: "Aerolinea" },
  { match: /(numero|nro|num)\s*(de)?\s*vuelo/, label: "Numero de vuelo" },
  { match: /escala|escalas|conexion/, label: "Escalas" },
  { match: /ruta/, label: "Ruta" },
  { match: /salida|departure/, label: "Salida" },
  { match: /llegada|arrival/, label: "Llegada" },
  { match: /origen/, label: "Origen" },
  { match: /destino/, label: "Destino" },
  { match: /tarifa|precio|costo/, label: "Tarifa" },
  { match: /asiento|seat/, label: "Asiento" },
  { match: /wifi|internet/, label: "WiFi" },
  { match: /comida|meal|snack|catering/, label: "Comidas" },
  { match: /reembolso|cambio|flexible/, label: "Flexibilidad" },
  { match: /seguro|proteccion|seguridad/, label: "Seguro" },
  { match: /carga|usb|enchufe|energia/, label: "Carga a bordo" },
  { match: /terminal|puerta|gate/, label: "Terminal" },
];

const humanizeFeatureLabel = (raw) => {
  const cleaned = String(raw || "").trim();
  if (!cleaned) return "";
  const normalized = normalizeText(cleaned);
  const mapped = FEATURE_LABEL_MAP.find((item) => item.match.test(normalized));
  if (mapped) return mapped.label;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const cleanFeatureValue = (value) => String(value || "")
  .replace(/^(duracion|duraci\u00f3n)( aproximada)?\s*:\s*/i, "")
  .replace(/^clase\s*:\s*/i, "")
  .replace(/^equipaje( incluido)?\s*:\s*/i, "")
  .replace(/^(aerolinea|aerol\u00ednea)\s*:\s*/i, "")
  .replace(/^n(umero|ro)?\s*de\s*vuelo\s*:\s*/i, "")
  .replace(/^(salida|llegada)\s*:\s*/i, "")
  .replace(/\s+/g, " ")
  .trim();

const isMeaningful = (value) => {
  const normalized = normalizeText(value);
  if (!normalized) return false;
  if (["-", "n/a", "na", "no disponible", "consultar"].includes(normalized)) return false;
  return true;
};

const parseFeatureItem = (raw, iconName) => {
  const text = String(raw || "").trim();
  if (!text) return null;
  const parts = text.split(":");
  if (parts.length === 1) {
    const label = humanizeFeatureLabel(text);
    if (!label) return null;
    return { label, value: "", iconName: iconName || text };
  }
  const [head, ...rest] = parts;
  const label = humanizeFeatureLabel(head);
  if (!label) return null;
  const value = cleanFeatureValue(rest.join(":").trim());
  return { label, value, iconName: iconName || head };
};

const buildComputedFeatures = (vuelo) => {
  const items = [];
  const addItem = (label, value) => {
    const cleaned = cleanFeatureValue(value);
    if (!isMeaningful(cleaned)) return;
    items.push({ label, value: cleaned, iconName: label });
  };

  const route = vuelo.origen && vuelo.destino ? `${vuelo.origen} -> ${vuelo.destino}` : "";
  addItem("Ruta", route);
  addItem("Aerolinea", vuelo.aerolinea);
  addItem("Numero de vuelo", vuelo.numeroVuelo);

  const segmentsCount = Array.isArray(vuelo.segmentos) ? vuelo.segmentos.length : 0;
  if (segmentsCount > 0) {
    const escalas = Math.max(0, segmentsCount - 1);
    const escalaLabel = escalas === 0 ? "Directo" : `${escalas} escala${escalas > 1 ? "s" : ""}`;
    addItem("Escalas", escalaLabel);
  }

  const salida = vuelo.fechaSalidaRaw ? formatDateTime(vuelo.fechaSalidaRaw) : vuelo.fechaSalida;
  const llegada = vuelo.fechaLlegadaRaw ? formatDateTime(vuelo.fechaLlegadaRaw) : vuelo.fechaLlegada;
  addItem("Salida", salida);
  addItem("Llegada", llegada);

  addItem("Duracion", vuelo.duracion);
  addItem("Clase", vuelo.clase);
  addItem("Equipaje", vuelo.equipaje);

  return items;
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

const resolveFeatureIcon = (label, iconName) => {
  const safe = normalizeText(`${label || ""} ${iconName || ""}`);
  if (/duracion|tiempo|hora/.test(safe)) return FaRegClock;
  if (/equipaje|maleta|bag|carry/.test(safe)) return FaSuitcaseRolling;
  if (/escala|escalas|conexion/.test(safe)) return FaMapSigns;
  if (/ruta|origen|destino/.test(safe)) return FaRoute;
  if (/salida|departure/.test(safe)) return FaPlaneDeparture;
  if (/llegada|arrival/.test(safe)) return FaPlaneArrival;
  if (/clase|cabina/.test(safe)) return FaChair;
  if (/tarifa|precio|costo/.test(safe)) return FaMoneyBillWave;
  if (/asiento|seat/.test(safe)) return FaChair;
  if (/wifi|internet/.test(safe)) return FaWifi;
  if (/comida|meal|snack|catering/.test(safe)) return FaUtensils;
  if (/reembolso|cambio|flexible/.test(safe)) return FaExchangeAlt;
  if (/seguro|proteccion|seguridad/.test(safe)) return FaShieldAlt;
  if (/carga|usb|enchufe|energia/.test(safe)) return FaPlug;
  if (/ticket|boleto|reserva/.test(safe)) return FaTicketAlt;
  if (/aerolinea|vuelo|flight|numero/.test(safe)) return FaPlane;
  const fallback = iconName ? getSafeIcon(iconName) : null;
  return fallback || FaPlane;
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
    const parsedFromFeatures = fromFeatures
      .map((f) => parseFeatureItem(f?.name, f?.icon))
      .filter(Boolean)
      .map((item) => ({
        ...item,
        value: isMeaningful(item.value) ? item.value : "",
      }));

    const rawList = Array.isArray(vuelo.caracteristicas) ? vuelo.caracteristicas : [];
    const parsedFromCaracteristicas = rawList
      .map((item) => parseFeatureItem(item))
      .filter(Boolean)
      .map((item) => ({
        ...item,
        value: isMeaningful(item.value) ? item.value : "",
      }));

    const computed = buildComputedFeatures(vuelo);

    const uniqueMap = new Map();
    const pushUnique = (items) => {
      items.forEach((item) => {
        if (!item?.label) return;
        const key = normalizeText(item.label);
        if (!key || uniqueMap.has(key)) return;
        uniqueMap.set(key, item);
      });
    };

    pushUnique(parsedFromFeatures);
    pushUnique(parsedFromCaracteristicas);
    pushUnique(computed);

    return Array.from(uniqueMap.values()).slice(0, 8);
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
                <h3>Caracteristicas del vuelo</h3>
                <div className="dv-features-grid">
                  {featureItems.map((feat, index) => {
                    const Icon = resolveFeatureIcon(feat.label, feat.iconName);
                    const hasValue = Boolean(feat.value);
                    return (
                      <div key={`${feat.label}-${index}`} className={`dv-feature-item ${hasValue ? "" : "is-compact"}`}>
                        <span className="dv-feature-icon">{Icon ? <Icon /> : null}</span>
                        <div className="dv-feature-content">
                          {hasValue ? (
                            <>
                              <span className="dv-feature-label">{feat.label}</span>
                              <span className="dv-feature-value">{feat.value}</span>
                            </>
                          ) : (
                            <span className="dv-feature-value">{feat.label}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
            
            <Link to={`/galeria/${vuelo.id}`} className="dv-btn-galeria-wide">
              Ver galería de imágenes
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}




















