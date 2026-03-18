import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import { es } from "react-day-picker/locale";
import {
  FaCalendarAlt,
  FaChair,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaExchangeAlt,
  FaExclamationCircle,
  FaHeart,
  FaMapSigns,
  FaMoneyBillWave,
  FaPlane,
  FaPlaneArrival,
  FaPlaneDeparture,
  FaPlug,
  FaRegClock,
  FaRegHeart,
  FaRoute,
  FaShieldAlt,
  FaSuitcaseRolling,
  FaStar,
  FaRegStar,
  FaTicketAlt,
  FaUtensils,
  FaWifi,
} from "react-icons/fa";

import productService from "../../services/productService";
import { addFavorite, getUserFavorites, removeFavorite } from "../../services/favoritesApi";
import { createBooking, getProductBookedDates, getUserBookings } from "../../services/bookingsApi";
import { createReview, getProductReviews } from "../../services/reviewsApi";
import { getVueloImage } from "../../utils/images";
import { getSafeIcon } from "../../utils/iconRegistry";
import "react-day-picker/style.css";
import "./DetalleVuelo.css";

const parseRouteName = (name, fallbackCountry = "-") => {
  const raw = name || "";
  const parts = raw
    .split(/->|\u2192/)
    .map((part) => part.trim())
    .filter(Boolean);

  return {
    origen: parts[0] || raw || "-",
    destino: parts[1] || fallbackCountry || "-",
  };
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const toISODateLocal = (date) => {
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const fromISODate = (value) => {
  if (!value) return null;
  const parts = String(value).split("-");
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const parseDateValue = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const formatTravelDateLabel = (value) => {
  const date = parseDateValue(value);
  if (!date) return "Sin fecha seleccionada";
  return date.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatReviewDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInitialTravelDate = (vuelo) => {
  const today = getStartOfToday();
  const preferred = parseDateValue(vuelo?.fechaSalidaRaw || vuelo?.departureDate);
  if (preferred && preferred >= today) return preferred;
  return today;
};

const normalizeText = (value) =>
  String(value || "")
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

const cleanFeatureValue = (value) =>
  String(value || "")
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
  return !["-", "n/a", "na", "no disponible", "consultar"].includes(normalized);
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
    : data.features?.map((feature) => feature.name).filter(Boolean) || [];

  const parsedCaracteristicas = caracteristicas
    .map((item) => String(item || "").split(":"))
    .map(([key, ...rest]) => ({
      key: key ? key.trim().toLowerCase() : "",
      value: rest.join(":").trim(),
    }))
    .filter((item) => item.key && item.value);

  const getFeatureValue = (patterns) => {
    const entry = parsedCaracteristicas.find((item) => patterns.some((pattern) => pattern.test(item.key)));
    return entry?.value || "";
  };

  const duracion = data?.duracion || getFeatureValue([/duracion/i, /duraci\u00f3n/i]) || "Consultar";
  const clase = data?.clase || getFeatureValue([/clase/i]) || "Economica";
  const equipaje = data?.equipaje || getFeatureValue([/equipaje/i, /maleta/i, /bag/i]) || "No incluido";
  const rawProductId = data.productId ?? data.id;
  const parsedProductId = Number(rawProductId);
  const localProductId = Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null;

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

const looksTechnicalDescription = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return true;

  const normalized = normalizeText(raw);
  return (
    normalized.includes("aerolinea:") ||
    normalized.includes("salida:") ||
    normalized.includes("llegada:") ||
    normalized.includes("vuelo:") ||
    normalized.includes("null") ||
    normalized.includes("undefined")
  );
};

const POLICY_ITEMS = [
  {
    title: "Documentacion y check-in",
    description:
      "Presenta un documento valido y realiza el check-in dentro de los tiempos indicados por la aerolinea.",
  },
  {
    title: "Equipaje permitido",
    description:
      "Verifica medidas y peso del equipaje. El exceso puede generar cargos adicionales en el aeropuerto.",
  },
  {
    title: "Cambios y cancelaciones",
    description:
      "Las modificaciones dependen de la tarifa seleccionada. Consulta condiciones antes de confirmar la reserva.",
  },
  {
    title: "Seguridad y embarque",
    description:
      "Llega con anticipacion al embarque y respeta las restricciones de seguridad para un abordaje fluido.",
  },
];

export default function DetalleVuelo() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [vuelo, setVuelo] = useState(location.state?.vuelo ? normalizeVuelo(location.state.vuelo) : null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTravelDate, setSelectedTravelDate] = useState(() => getStartOfToday());
  const [bookedDates, setBookedDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfToday());
  const [calendarExpanded, setCalendarExpanded] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [ratingValue, setRatingValue] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [reviewGateMessage, setReviewGateMessage] = useState("");

  const featureItems = useMemo(() => {
    if (!vuelo) return [];

    const fromFeatures = Array.isArray(vuelo.features) ? vuelo.features : [];
    const parsedFromFeatures = fromFeatures
      .map((feature) => parseFeatureItem(feature?.name, feature?.icon))
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

    return Array.from(uniqueMap.values());
  }, [vuelo]);

  const imageList = useMemo(() => {
    if (!vuelo) return [];

    const items = [];
    const pushUnique = (src) => {
      if (!src) return;
      if (!items.includes(src)) items.push(src);
    };

    if (Array.isArray(vuelo.imagesBase64)) vuelo.imagesBase64.forEach(pushUnique);
    if (Array.isArray(vuelo.imagenesPais)) vuelo.imagenesPais.forEach(pushUnique);
    pushUnique(vuelo.imagenPrincipal);
    pushUnique(getVueloImage(vuelo));

    return items.filter(Boolean);
  }, [vuelo]);

  useEffect(() => {
    if (!imageList.length) {
      setSelectedImage(null);
      return;
    }

    setSelectedImage((prev) => {
      if (prev && imageList.includes(prev)) return prev;
      return imageList[0];
    });
  }, [imageList]);

  const escalaResumen = useMemo(() => {
    const escalas = featureItems.find((item) => normalizeText(item.label) === "escalas");
    return escalas?.value || "Directo";
  }, [featureItems]);

  const descriptionText = useMemo(() => {
    const rawDescription = vuelo?.descripcion || vuelo?.description || "";
    if (!looksTechnicalDescription(rawDescription)) return rawDescription;

    const destino = vuelo?.paisDestino || vuelo?.destino || "este destino";
    return `Viaja hacia ${destino} con ${vuelo?.aerolinea || "tu aerolinea seleccionada"} en una experiencia pensada para resolver la reserva rapido, con informacion clara sobre tu salida, llegada y disponibilidad real.`;
  }, [vuelo]);

  const ratingSummary = useMemo(() => {
    if (!reviews.length) {
      return { average: 0, total: 0 };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    return { average: sum / total, total };
  }, [reviews]);

  const ratingDisplay = ratingSummary.total ? ratingSummary.average.toFixed(1) : "0.0";

  const bookedDateSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const disabledDates = useMemo(() => bookedDates.map(fromISODate).filter(Boolean), [bookedDates]);
  const today = useMemo(() => getStartOfToday(), []);
  const disabledMatchers = useMemo(() => [{ before: today }, ...disabledDates], [disabledDates, today]);
  const availableMatcher = useMemo(
    () => (date) => {
      if (!date || Number.isNaN(date.getTime())) return false;
      if (date < today) return false;
      const iso = toISODateLocal(date);
      if (!iso) return false;
      return !bookedDateSet.has(iso);
    },
    [bookedDateSet, today]
  );
  const calendarModifiers = useMemo(
    () => ({ booked: disabledDates, available: availableMatcher }),
    [availableMatcher, disabledDates]
  );
  const selectedDateISO = useMemo(() => toISODateLocal(selectedTravelDate), [selectedTravelDate]);
  const selectedDateLabel = useMemo(() => formatTravelDateLabel(selectedTravelDate), [selectedTravelDate]);
  const selectedDateBooked = Boolean(selectedDateISO) && bookedDateSet.has(selectedDateISO);
  const bookedDatesSummary = bookedDates.length
    ? `${bookedDates.length} fecha${bookedDates.length > 1 ? "s" : ""} ya reservada${bookedDates.length > 1 ? "s" : ""}.`
    : "Todavia no hay fechas reservadas para este vuelo.";
  const bookingButtonLabel = bookingLoading
    ? "Reservando..."
    : selectedDateBooked
      ? "Fecha no disponible"
      : "Reservar ahora";
  const canReserve =
    Boolean(vuelo?.localProductId) && !availabilityLoading && !bookingLoading && !selectedDateBooked;

  const handleTravelDateSelect = (date) => {
    if (!date) return;
    const nextDate = parseDateValue(date) || getStartOfToday();
    setSelectedTravelDate(nextDate);
    setVisibleMonth(nextDate);
    setBookingFeedback(null);
  };

  useEffect(() => {
    const loadVuelo = async () => {
      setLoading(true);
      setLoadError("");

      let data = null;
      const stateVuelo = location.state?.vuelo || null;
      const stateLocalId = Number(stateVuelo?.productId ?? stateVuelo?.id);
      const detailId = Number(id);

      const localIdCandidate =
        Number.isInteger(stateLocalId) && stateLocalId > 0
          ? stateLocalId
          : Number.isInteger(detailId) && detailId > 0
            ? detailId
            : null;

      if (localIdCandidate) {
        try {
          data = await productService.getById(localIdCandidate);
        } catch {
          data = null;
        }
      }

      if (!data) {
        try {
          data = await productService.obtenerVueloPorIdAPI(id);
        } catch {
          data = null;
        }
      }

      if (!data && stateVuelo) data = stateVuelo;

      const normalizado = normalizeVuelo(data);
      if (normalizado) setVuelo(normalizado);
      else setLoadError("No se pudo cargar el detalle de este vuelo.");

      setLoading(false);
    };

    loadVuelo();
  }, [id, location.state]);

  const loadAvailability = async (productId) => {
    if (!productId) {
      setBookedDates([]);
      setAvailabilityError("");
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError("");

    try {
      const dates = await getProductBookedDates(productId);
      setBookedDates(dates);
    } catch (err) {
      console.error("Error cargando disponibilidad:", err);
      setAvailabilityError("No se pudo obtener la disponibilidad en este momento.");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  useEffect(() => {
    if (!vuelo?.localProductId) {
      setBookedDates([]);
      setAvailabilityError("");
      return;
    }

    loadAvailability(vuelo.localProductId);
  }, [vuelo?.localProductId]);

  useEffect(() => {
    if (!vuelo?.localProductId) {
      setReviews([]);
      setReviewsError("");
      return;
    }

    let isMounted = true;
    setReviewsLoading(true);
    setReviewsError("");

    getProductReviews(vuelo.localProductId)
      .then((data) => {
        if (isMounted) setReviews(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error cargando reseñas:", err);
        if (isMounted) setReviewsError("No se pudieron cargar las valoraciones.");
      })
      .finally(() => {
        if (isMounted) setReviewsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vuelo?.localProductId]);

  useEffect(() => {
    if (!vuelo?.localProductId) {
      setCanReview(false);
      setReviewGateMessage("Este vuelo no tiene valoraciones disponibles.");
      return;
    }

    if (!user) {
      setCanReview(false);
      setReviewGateMessage("Inicia sesion para valorar este vuelo.");
      return;
    }

    let isMounted = true;
    setReviewGateMessage("");

    getUserBookings()
      .then((bookings) => {
        if (!isMounted) return;
        const hasBooking = (bookings || []).some((booking) => {
          const bookingProductId =
            booking?.product?.id ??
            booking?.productId ??
            booking?.product?.productId ??
            booking?.product?.product_id;
          return Number(bookingProductId) === Number(vuelo.localProductId);
        });
        setCanReview(hasBooking);
        setReviewGateMessage(
          hasBooking ? "" : "Solo puedes valorar si ya finalizaste una reserva para este vuelo."
        );
      })
      .catch((err) => {
        console.error("Error validando reservas:", err);
        if (isMounted) {
          setCanReview(false);
          setReviewGateMessage("No pudimos validar tu reserva en este momento.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [user, vuelo?.localProductId]);

  useEffect(() => {
    if (!vuelo) return;
    const initialDate = getInitialTravelDate(vuelo);
    setSelectedTravelDate(initialDate);
    setVisibleMonth(initialDate);
    setBookingFeedback(null);
  }, [vuelo]);

  useEffect(() => {
    setRatingValue(0);
    setHoverRating(0);
    setReviewComment("");
  }, [vuelo?.localProductId]);

  useEffect(() => {
    const loadFavs = async () => {
      if (!user || !vuelo?.localProductId) return;
      try {
        const favs = await getUserFavorites();
        setIsFavorite((prev) => {
          const next = (favs || []).some((favorite) => Number(favorite.id) === Number(vuelo.localProductId));
          return prev === next ? prev : next;
        });
      } catch (err) {
        console.error("Error cargando favoritos:", err);
      }
    };

    loadFavs();
  }, [user, vuelo?.localProductId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/resultados");
  };

  const handleFavorite = async () => {
    if (!user) {
      alert("Debes iniciar sesion para agregar favoritos.");
      navigate("/login");
      return;
    }

    if (!vuelo?.localProductId) {
      alert("Este vuelo no esta guardado en la base para favoritos.");
      return;
    }

    try {
      if (isFavorite) await removeFavorite(vuelo.localProductId);
      else await addFavorite(vuelo.localProductId);
      setIsFavorite((prev) => !prev);
    } catch (err) {
      console.error("Error actualizando favorito:", err);
      alert("No se pudo actualizar el favorito.");
    }
  };

  const renderStars = (value) => (
    <div className="dv-stars">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <span key={star} className={`dv-star ${filled ? "is-filled" : ""}`}>
            {filled ? <FaStar /> : <FaRegStar />}
          </span>
        );
      })}
    </div>
  );

  const handleReviewSubmit = async () => {
    if (!user) {
      alert("Debes iniciar sesion para valorar este vuelo.");
      navigate("/login");
      return;
    }

    if (!vuelo?.localProductId) {
      setReviewsError("Este vuelo no esta disponible para valoraciones.");
      return;
    }

    if (!canReview) {
      setReviewsError("Solo puedes valorar si ya finalizaste una reserva.");
      return;
    }

    if (!ratingValue) {
      setReviewsError("Selecciona una puntuacion antes de publicar tu reseña.");
      return;
    }

    setReviewSubmitting(true);
    setReviewsError("");

    try {
      const newReview = await createReview({
        productId: String(vuelo.localProductId),
        rating: ratingValue,
        comment: reviewComment,
      });

      setReviews((prev) => {
        const filtered = prev.filter(
          (item) => item?.id !== newReview?.id && item?.userId !== newReview?.userId
        );
        return [newReview, ...filtered];
      });
      setRatingValue(0);
      setHoverRating(0);
      setReviewComment("");
    } catch (err) {
      console.error("Error enviando reseña:", err);
      setReviewsError(err?.message || "No se pudo publicar la reseña.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      alert("Debes iniciar sesion para reservar un vuelo.");
      navigate("/login");
      return;
    }

    if (!vuelo?.localProductId) {
      alert("Este vuelo no esta disponible para reserva directa.");
      return;
    }

    if (!selectedDateISO) {
      setBookingFeedback({
        type: "error",
        message: "Selecciona una fecha de viaje antes de reservar.",
      });
      return;
    }

    if (selectedDateBooked) {
      setBookingFeedback({
        type: "error",
        message: "Esa fecha ya esta ocupada. Elige otra para continuar.",
      });
      return;
    }

    setBookingLoading(true);
    setBookingFeedback(null);

    try {
      await createBooking({
        productId: vuelo.localProductId,
        dateStr: selectedDateISO,
        passengers: 1,
      });

      await loadAvailability(vuelo.localProductId);
      setBookingFeedback({
        type: "success",
        message: `Reserva creada para ${selectedDateLabel}.`,
      });
    } catch (err) {
      console.error("Error creando reserva:", err);
      setBookingFeedback({
        type: "error",
        message: err?.message || "No se pudo completar la reserva.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const heroImage = selectedImage || imageList[0] || "/assets/avionsito.png";
  const galleryId = vuelo?.localProductId || vuelo?.id;

  if (loading) {
    return (
      <div className="detalle-page-container">
        <div className="detalle-card-wrapper">
          <p className="dv-availability-state">Cargando detalle del vuelo...</p>
        </div>
      </div>
    );
  }

  if (!vuelo || loadError) {
    return (
      <div className="detalle-page-container">
        <div className="detalle-card-wrapper">
          <div className="dv-availability-error">
            <span>{loadError || "No se encontro el vuelo."}</span>
            <button type="button" className="dv-availability-retry" onClick={handleBack}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="detalle-page-container">
      <header className="detalle-header-bar">
        <div className="detalle-header-inner">
          <div className="dv-header-left">
            <h1 className="dv-header-title">
              {vuelo.origen} {"->"} {vuelo.destino}
            </h1>
            <p className="dv-header-subtitle">
              {vuelo.aerolinea} - {vuelo.numeroVuelo}
            </p>
          </div>
          <div className="dv-back-right">
            <button type="button" className="dv-back-btn" onClick={handleBack} aria-label="Volver">
              <FaChevronLeft />
            </button>
          </div>
        </div>
      </header>

      <div className="detalle-card-wrapper">
        <section className="dv-hero">
          <div className="dv-hero-media">
            <div className="dv-hero-image">
              <img
                src={heroImage}
                alt={`Vuelo ${vuelo.origen} a ${vuelo.destino}`}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/assets/avionsito.png";
                }}
              />
              <div className="dv-hero-overlay">
                <div className="dv-hero-copy">
                  <span className="dv-hero-badge">JETSET AIR</span>
                  <h2 className="dv-hero-title">{vuelo.paisDestino || "Tu proximo destino"}</h2>
                </div>
              </div>
            </div>

            {imageList.length > 1 && (
              <div className="dv-gallery-row dv-gallery-thumbs">
                {imageList.map((src, index) => {
                  const isActive = src === heroImage;
                  return (
                    <button
                      key={`${index}-${src}`}
                      type="button"
                      className={`dv-gallery-thumb ${isActive ? "is-active" : ""}`}
                      onClick={() => setSelectedImage(src)}
                      aria-label={`Ver imagen ${index + 1} del vuelo`}
                      aria-pressed={isActive}
                    >
                      <img
                        src={src}
                        alt={`Vista ${index + 1} de ${vuelo.destino}`}
                        className="dv-gallery-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = "/assets/avionsito.png";
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="dv-hero-side">
            <div className="dv-meta">
              <div className="dv-route-block">
                <span className="dv-country">{vuelo.paisDestino || "Destino"}</span>
                <h2 className="dv-route-title">
                  {vuelo.origen} - {vuelo.destino}
                </h2>
                <p className="dv-route-sub">
                  {vuelo.aerolinea} - {vuelo.numeroVuelo} / {escalaResumen}
                </p>
              </div>
              <button
                type="button"
                className={`dv-icon-btn ${isFavorite ? "is-active" : ""}`}
                onClick={handleFavorite}
                aria-label={isFavorite ? "Quitar favorito" : "Agregar favorito"}
              >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
              </button>
            </div>

            <div className="dv-description">
              <h3>Descripcion</h3>
              <p>{descriptionText}</p>
            </div>

            <div className="dv-reviews">
              <div className="dv-reviews-head">
                <div>
                  <h3>Valoraciones</h3>
                  <p className="dv-reviews-sub">
                    Opiniones reales de viajeros que ya reservaron este vuelo.
                  </p>
                </div>
                <div className="dv-rating-summary">
                  {renderStars(Math.round(ratingSummary.average))}
                  <div className="dv-rating-meta">
                    <span className="dv-rating-score">{ratingDisplay}</span>
                    <span className="dv-rating-count">
                      {ratingSummary.total} valoracion{ratingSummary.total === 1 ? "" : "es"}
                    </span>
                  </div>
                </div>
              </div>

              {reviewsError && <div className="dv-reviews-error">{reviewsError}</div>}

              {reviewsLoading && <p className="dv-review-empty">Cargando valoraciones...</p>}

              {!reviewsLoading && reviews.length === 0 && (
                <p className="dv-review-empty">Aun no hay valoraciones publicadas.</p>
              )}

              {!reviewsLoading && reviews.length > 0 && (
                <div className="dv-review-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="dv-review-card">
                      <div className="dv-review-meta">
                        {renderStars(review.rating)}
                        <span className="dv-review-user">{review.userName || "Usuario"}</span>
                        <span className="dv-review-date">{formatReviewDate(review.createdAt)}</span>
                      </div>
                      {review.comment ? (
                        <p className="dv-review-comment">{review.comment}</p>
                      ) : (
                        <p className="dv-review-comment is-empty">Sin comentario adicional.</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="dv-review-form">
                <h4>Tu reseña</h4>
                {user && canReview ? (
                  <>
                    <div
                      className="dv-star-input"
                      onMouseLeave={() => setHoverRating(0)}
                      role="radiogroup"
                      aria-label="Selecciona una puntuacion"
                    >
                      {[1, 2, 3, 4, 5].map((star) => {
                        const displayValue = hoverRating || ratingValue;
                        const filled = star <= displayValue;
                        return (
                          <button
                            key={star}
                            type="button"
                            className={`dv-star-btn ${filled ? "is-filled" : ""}`}
                            onMouseEnter={() => setHoverRating(star)}
                            onClick={() => setRatingValue(star)}
                            aria-pressed={ratingValue === star}
                            aria-label={`${star} estrellas`}
                          >
                            {filled ? <FaStar /> : <FaRegStar />}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      className="dv-review-textarea"
                      value={reviewComment}
                      onChange={(event) => setReviewComment(event.target.value)}
                      placeholder="Escribe tu experiencia (opcional)"
                      rows={4}
                    />
                    <button
                      type="button"
                      className="dv-review-submit"
                      onClick={handleReviewSubmit}
                      disabled={reviewSubmitting}
                    >
                      {reviewSubmitting ? "Publicando..." : "Publicar reseña"}
                    </button>
                  </>
                ) : (
                  <div className="dv-review-gate">
                    <p>{reviewGateMessage || "Inicia sesion para valorar este vuelo."}</p>
                    {!user && (
                      <button type="button" className="dv-review-login" onClick={() => navigate("/login")}>
                        Iniciar sesion
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {featureItems.length > 0 && (
              <div className="dv-features-block">
                <h3>Caracteristicas del vuelo</h3>
                <div className="dv-features-grid">
                  {featureItems.map((feature, index) => {
                    const Icon = resolveFeatureIcon(feature.label, feature.iconName);
                    const hasValue = Boolean(feature.value);

                    return (
                      <div
                        key={`${feature.label}-${index}`}
                        className={`dv-feature-item ${hasValue ? "" : "is-compact"}`}
                      >
                        <span className="dv-feature-icon">{Icon ? <Icon /> : null}</span>
                        <div className="dv-feature-content">
                          {hasValue ? (
                            <>
                              <span className="dv-feature-label">{feature.label}</span>
                              <span className="dv-feature-value">{feature.value}</span>
                            </>
                          ) : (
                            <span className="dv-feature-value">{feature.label}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="dv-policies">
              <h3 className="dv-policies-title">Politicas de uso</h3>
              <div className="dv-policies-grid">
                {POLICY_ITEMS.map((policy) => (
                  <div key={policy.title} className="dv-policy-card">
                    <h4>{policy.title}</h4>
                    <p>{policy.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="dv-availability">
              <div className="dv-availability-head">
                <h3>Disponibilidad real</h3>
                <div className="dv-availability-legend">
                  <span className="dv-legend-item">
                    <span className="dv-legend-dot is-available" />
                    Disponible
                  </span>
                  <span className="dv-legend-item">
                    <span className="dv-legend-dot is-booked" />
                    Ocupada
                  </span>
                </div>
              </div>

              <div className="dv-selection-strip">
                <div className="dv-selection-copy">
                  <span className="dv-selection-label">Fecha de viaje</span>
                  <strong className="dv-selection-date">{selectedDateLabel}</strong>
                  <p className="dv-selection-helper">
                    {bookedDatesSummary} Las fechas ocupadas se validan en la interfaz y tambien en el servidor.
                  </p>
                </div>
                <span className={`dv-selection-badge ${selectedDateBooked ? "is-booked" : "is-available"}`}>
                  {selectedDateBooked ? "Ocupada" : "Disponible"}
                </span>
              </div>

              {bookingFeedback && (
                <div className={`dv-feedback is-${bookingFeedback.type}`}>
                  {bookingFeedback.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
                  <span>{bookingFeedback.message}</span>
                </div>
              )}

              {availabilityLoading && <p className="dv-availability-state">Cargando fechas disponibles...</p>}

              {!availabilityLoading && !vuelo?.localProductId && (
                <p className="dv-availability-state">
                  Este vuelo aun no tiene disponibilidad publicada para reserva directa.
                </p>
              )}

              {availabilityError && (
                <div className="dv-availability-error">
                  <span>{availabilityError}</span>
                  <button
                    type="button"
                    className="dv-availability-retry"
                    onClick={() => loadAvailability(vuelo?.localProductId)}
                  >
                    Reintentar
                  </button>
                </div>
              )}

              {!availabilityLoading && !availabilityError && vuelo?.localProductId && (
                <div className="dv-calendar">
                  <div className="dv-calendar-grid">
                    <div className="dv-calendar-panel">
                      <h4 className="dv-calendar-title">Selecciona tu fecha</h4>
                      <p className="dv-calendar-copy">
                        Elige el dia en el que quieres reservar este vuelo. Si otra persona se adelanta, el backend
                        bloqueara esa fecha para evitar dobles reservas.
                      </p>
                      <div className="dv-calendar-actions">
                        <button
                          type="button"
                          className={`dv-calendar-toggle ${calendarExpanded ? "is-active" : ""}`}
                          onClick={() => setCalendarExpanded((prev) => !prev)}
                        >
                          {calendarExpanded ? "Ver 1 mes" : "Ver 2 meses"}
                        </button>
                        <span className="dv-calendar-hint">
                          {calendarExpanded ? "Mostrando 2 meses" : "Vista compacta"}
                        </span>
                      </div>
                      <div className={`dv-calendar-shell ${calendarExpanded ? "is-expanded" : "is-collapsed"}`}>
                        <DayPicker
                          mode="single"
                          locale={es}
                          className={`dv-daypicker ${calendarExpanded ? "is-dual" : "is-single"}`}
                          selected={selectedTravelDate}
                          month={visibleMonth}
                          onMonthChange={setVisibleMonth}
                          onSelect={handleTravelDateSelect}
                          disabled={disabledMatchers}
                          modifiers={calendarModifiers}
                          modifiersClassNames={{ booked: "dv-day-booked", available: "dv-day-available" }}
                          numberOfMonths={calendarExpanded ? 2 : 1}
                          pagedNavigation={calendarExpanded}
                          showOutsideDays
                          fixedWeeks
                          animate
                          navLayout="around"
                          components={{
                            Chevron: ({ orientation, className }) =>
                              orientation === "left" ? (
                                <FaChevronLeft className={className} />
                              ) : (
                                <FaChevronRight className={className} />
                              ),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="dv-price-bar">
              <div className="dv-price-info">
                <span>Desde</span>
                <strong>${vuelo.precioTotal}</strong>
                <em>por persona</em>
              </div>

              <div className="dv-price-meta">
                <span>
                  <FaCalendarAlt /> Fecha elegida
                </span>
                <strong>{selectedDateLabel}</strong>
                <em>{selectedDateBooked ? "Selecciona otra fecha para continuar." : "Lista para confirmar."}</em>
              </div>

              <button className="dv-btn-reservar" onClick={handleBooking} disabled={!canReserve}>
                {bookingButtonLabel}
              </button>
            </div>

            {galleryId ? (
              <div className="dv-secondary-actions">
                <Link to={`/galeria/${galleryId}`} className="dv-btn-galeria-wide">
                  Ver galeria de imagenes
                </Link>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
