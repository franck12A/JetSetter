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
import { normalizeAirlineName } from "../../utils/flightMetadata";
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

const parseDateOnly = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const isBookingFinalized = (booking, referenceDate = new Date()) => {
  if (!booking) return false;
  const status = String(booking.status || "").trim().toUpperCase();
  if (status) {
    if (["FINALIZADA", "FINALIZADO", "COMPLETADA", "COMPLETADO", "COMPLETED"].includes(status)) {
      return true;
    }
    if (status.includes("CANCEL")) {
      return false;
    }
  }

  const baseDate =
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
      : getStartOfToday();
  const travelDate = parseDateOnly(booking.travelDate || booking.travel_date);
  if (travelDate) return travelDate <= baseDate;
  const bookingDate = parseDateOnly(booking.bookingDate || booking.booking_date);
  if (bookingDate) return bookingDate <= baseDate;
  return false;
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

const getStoredToken = () => {
  const directToken = localStorage.getItem("token");
  if (directToken && directToken !== "null" && directToken !== "undefined") {
    return directToken.startsWith("Bearer ") ? directToken.slice(7) : directToken;
  }

  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    const userToken = storedUser?.token;
    if (!userToken || userToken === "null" || userToken === "undefined") return null;
    return userToken.startsWith("Bearer ") ? userToken.slice(7) : userToken;
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    const payload = JSON.parse(atob(payloadBase64));
    if (!payload?.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

const formatMonthYear = (value) => {
  if (!value) return "Sin fecha";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return date.toLocaleDateString("es-AR", {
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
  { match: /duracion|tiempo|hora/, label: "Duración" },
  { match: /clase|cabina/, label: "Clase" },
  { match: /equipaje|maleta|bag|carry/, label: "Equipaje" },
  { match: /aerolinea|airline/, label: "Aerolínea" },
  { match: /(numero|nro|num)\s*(de)?\s*vuelo/, label: "Número de vuelo" },
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
    .replace(/^(duracion|duración)( aproximada)?\s*:\s*/i, "")
    .replace(/^clase\s*:\s*/i, "")
    .replace(/^equipaje( incluido)?\s*:\s*/i, "")
    .replace(/^(aerolinea|aerolínea)\s*:\s*/i, "")
    .replace(/^n(umero|ro)?\s*de\s*vuelo\s*:\s*/i, "")
    .replace(/^(salida|llegada)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeFeatureDisplayValue = (label, value) => {
  const normalizedLabel = normalizeText(label);
  if (normalizedLabel === "aerolinea") {
    return normalizeAirlineName(value);
  }
  return value;
};

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
  const value = normalizeFeatureDisplayValue(label, cleanFeatureValue(rest.join(":").trim()));
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
  addItem("Aerolínea", vuelo.aerolinea);
  addItem("Número de vuelo", vuelo.numeroVuelo);

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
  addItem("Duración", vuelo.duracion);
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

  const duracion = data?.duracion || getFeatureValue([/duracion/i, /duración/i]) || "Consultar";
  const clase = data?.clase || getFeatureValue([/clase/i]) || "Económica";
  const equipaje = data?.equipaje || getFeatureValue([/equipaje/i, /maleta/i, /bag/i]) || "No incluido";
  const isExternal = Boolean(data?.isExternal || data?.source === "amadeus" || data?.externalId);
  const rawProductId = data.productId ?? data.id;
  const parsedProductId = Number(rawProductId);
  const localProductId = Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null;
  const airlineName = normalizeAirlineName(
    data.airlineName ||
      data.aerolinea ||
      data.airline ||
      primerSegmento.airlineName ||
      primerSegmento.aerolinea ||
      primerSegmento.airline
  );
  const flightNumber =
    data.flightNumber ||
    data.numeroVuelo ||
    data.flight_number ||
    primerSegmento.flightNumber ||
    primerSegmento.numeroVuelo ||
    primerSegmento.flight_number ||
    "No disponible";

  return {
    ...data,
    id: data.id ?? data.productId ?? null,
    localProductId,
    isExternal,
    airlineName,
    flightNumber,
    aerolinea: airlineName,
    numeroVuelo: flightNumber,
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
    title: "Documentación y check-in",
    description:
      "Presenta un documento válido y realiza el check-in dentro de los tiempos indicados por la aerolínea.",
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
      "Llega con anticipación al embarque y respeta las restricciones de seguridad para un abordaje fluido.",
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
  const [tripType, setTripType] = useState("oneway");
  const [selectedTravelDate, setSelectedTravelDate] = useState(() => getStartOfToday());
  const [selectedReturnDate, setSelectedReturnDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingFeedback, setBookingFeedback] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(() => getStartOfToday());
  const [returnVisibleMonth, setReturnVisibleMonth] = useState(() => getStartOfToday());
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

  const featureHighlights = useMemo(() => featureItems.slice(0, 4), [featureItems]);
  const featureExtras = useMemo(() => featureItems.slice(4), [featureItems]);

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

  const heroSubtitle = useMemo(() => {
    if (!vuelo) return "";

    const parts = [];
    if (escalaResumen) {
      const normalized = normalizeText(escalaResumen);
      if (normalized === "directo") {
        parts.push("Vuelo directo");
      } else {
        parts.push(`Vuelo con ${escalaResumen.toLowerCase()}`);
      }
    }

    if (vuelo.clase) parts.push(vuelo.clase);
    if (vuelo.aerolinea) parts.push(vuelo.aerolinea);

    const cleaned = parts.filter(Boolean);
    return cleaned.length > 0 ? cleaned.join(" · ") : "Experiencia premium";
  }, [escalaResumen, vuelo]);

  const heroTitle = useMemo(() => {
    if (!vuelo) return "Tu próximo destino";
    const parts = [];
    if (vuelo.destino) parts.push(vuelo.destino);
    if (vuelo.paisDestino && normalizeText(vuelo.paisDestino) !== normalizeText(vuelo.destino)) {
      parts.push(vuelo.paisDestino);
    }
    const merged = parts.filter(Boolean).join(", ");
    return merged || vuelo.paisDestino || vuelo.destino || "Tu próximo destino";
  }, [vuelo]);

  const descriptionText = useMemo(() => {
    const rawDescription = vuelo?.descripcion || vuelo?.description || "";
    if (!looksTechnicalDescription(rawDescription)) return rawDescription;

    const destino = vuelo?.paisDestino || vuelo?.destino || "este destino";
    return `Viaja hacia ${destino} con ${vuelo?.aerolinea || "tu aerolínea seleccionada"} en una experiencia pensada para resolver la reserva rápido, con información clara sobre tu salida, llegada y disponibilidad real.`;
  }, [vuelo]);

  const ratingSummary = useMemo(() => {
    if (!reviews.length) {
      return { average: 0, total: 0 };
    }
    const total = reviews.length;
    const sum = reviews.reduce((acc, item) => acc + (Number(item.rating) || 0), 0);
    return { average: sum / total, total };
  }, [reviews]);

  const ratingDisplayValue = ratingSummary.total ? ratingSummary.average : 0;
  const ratingDisplay = ratingDisplayValue.toFixed(1);
  const ratingSourceLabel = ratingSummary.total ? "Valoraciones de usuarios" : "Sin valoraciones aún";
  const quickStats = useMemo(() => {
    if (!vuelo) return [];
    return [
      {
        label: "Salida",
        value: formatMonthYear(vuelo.fechaSalidaRaw || vuelo.departureDate || vuelo.fechaSalida),
        icon: FaCalendarAlt,
      },
      {
        label: "Clase",
        value: vuelo.clase || "Económica",
        icon: FaChair,
      },
      {
        label: "Equipaje",
        value: vuelo.equipaje || "No incluido",
        icon: FaSuitcaseRolling,
      },
    ];
  }, [vuelo]);

  const bookedDateSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const disabledDates = useMemo(() => bookedDates.map(fromISODate).filter(Boolean), [bookedDates]);
  const today = useMemo(() => getStartOfToday(), []);
  const isRoundTrip = tripType === "roundtrip";
  const disabledMatchers = useMemo(() => [{ before: today }, ...disabledDates], [disabledDates, today]);
  const departureAvailableMatcher = useMemo(
    () => (date) => {
      if (!date || Number.isNaN(date.getTime())) return false;
      if (date < today) return false;
      const iso = toISODateLocal(date);
      if (!iso) return false;
      return !bookedDateSet.has(iso);
    },
    [bookedDateSet, today]
  );
  const returnDisabledMatchers = useMemo(
    () => [{ before: selectedTravelDate || today }, ...disabledDates],
    [disabledDates, selectedTravelDate, today]
  );
  const returnAvailableMatcher = useMemo(
    () => (date) => {
      if (!date || Number.isNaN(date.getTime())) return false;
      if (!selectedTravelDate || date < selectedTravelDate) return false;
      const iso = toISODateLocal(date);
      if (!iso) return false;
      return !bookedDateSet.has(iso);
    },
    [bookedDateSet, selectedTravelDate]
  );
  const departureCalendarModifiers = useMemo(
    () => ({ booked: disabledDates, available: departureAvailableMatcher }),
    [departureAvailableMatcher, disabledDates]
  );
  const returnCalendarModifiers = useMemo(
    () => ({ booked: disabledDates, available: returnAvailableMatcher }),
    [disabledDates, returnAvailableMatcher]
  );
  const selectedDateISO = useMemo(() => toISODateLocal(selectedTravelDate), [selectedTravelDate]);
  const selectedDateLabel = useMemo(() => formatTravelDateLabel(selectedTravelDate), [selectedTravelDate]);
  const selectedDateBooked = Boolean(selectedDateISO) && bookedDateSet.has(selectedDateISO);
  const selectedReturnDateISO = useMemo(() => toISODateLocal(selectedReturnDate), [selectedReturnDate]);
  const selectedReturnDateLabel = useMemo(
    () => formatTravelDateLabel(selectedReturnDate),
    [selectedReturnDate]
  );
  const selectedReturnDateBooked =
    Boolean(selectedReturnDateISO) && bookedDateSet.has(selectedReturnDateISO);
  const bookedDatesSummary = bookedDates.length
    ? `${bookedDates.length} fecha${bookedDates.length > 1 ? "s" : ""} ya reservada${bookedDates.length > 1 ? "s" : ""}.`
    : "Todavía no hay fechas reservadas para este vuelo.";
  const availabilitySummary = vuelo?.localProductId
    ? bookedDatesSummary
    : "Podés elegir fechas, pero este vuelo todavía no publica reserva directa.";
  const dateSelectionHelp = selectedDateBooked
    ? "La fecha de salida seleccionada está ocupada. Selecciona otra para continuar."
    : isRoundTrip && !selectedReturnDateISO
      ? "Seleccioná una fecha de regreso para completar el viaje."
      : isRoundTrip && selectedReturnDateBooked
        ? "La fecha de regreso seleccionada está ocupada. Elegí otra para continuar."
        : availabilitySummary;
  const departureCalendarMonthCount = isRoundTrip ? 1 : 2;
  const isSelectionIncomplete = !selectedDateISO || (isRoundTrip && !selectedReturnDateISO);
  const hasUnavailableSelection = selectedDateBooked || (isRoundTrip && selectedReturnDateBooked);
  const bookingButtonLabel = bookingLoading
    ? "Reservando..."
    : !selectedDateISO
      ? "Seleccioná salida"
      : isRoundTrip && !selectedReturnDateISO
        ? "Seleccioná regreso"
        : hasUnavailableSelection
      ? "Fecha no disponible"
      : "Reservar ahora";
  const canReserve =
    Boolean(vuelo?.localProductId) &&
    !availabilityLoading &&
    !bookingLoading &&
    !isSelectionIncomplete &&
    !hasUnavailableSelection;

  const checkReviewEligibility = async () => {
    if (!vuelo?.localProductId) {
      setCanReview(false);
      setReviewGateMessage("Este vuelo no tiene valoraciones disponibles.");
      return;
    }

    const token = getStoredToken();
    if (!user || !token) {
      setCanReview(false);
      setReviewGateMessage("Inicia sesi\u00f3n para valorar este vuelo.");
      return;
    }

    if (isTokenExpired(token)) {
      setCanReview(false);
      setReviewGateMessage("Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.");
      return;
    }

    setReviewGateMessage("");

    try {
      const bookings = await getUserBookings();
      const hasBooking = (bookings || []).some((booking) => {
        const bookingProductId =
          booking?.product?.id ??
          booking?.productId ??
          booking?.product?.productId ??
          booking?.product?.product_id;
        if (Number(bookingProductId) !== Number(vuelo.localProductId)) return false;
        return isBookingFinalized(booking, today);
      });
      setCanReview(hasBooking);
      if (hasBooking) {
        setReviewGateMessage("");
      } else {
        setReviewGateMessage("Necesitas una reserva finalizada para dejar tu rese\u00f1a.");
      }
    } catch (err) {
      console.error("Error validando reservas:", err);
      setCanReview(false);
      const rawMessage = String(err?.message || "");
      if (/token|autenticado|sesion/i.test(rawMessage)) {
        setReviewGateMessage("Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.");
      } else {
        setReviewGateMessage("No pudimos validar tu reserva en este momento.");
      }
    }
  };

  const handleTravelDateSelect = (date) => {
    if (!date) return;
    const nextDate = parseDateValue(date) || getStartOfToday();
    setSelectedTravelDate(nextDate);
    setVisibleMonth(nextDate);
    setSelectedReturnDate((current) => {
      if (!current) return current;
      return current < nextDate ? null : current;
    });
    setReturnVisibleMonth((current) => {
      if (!current || current < nextDate) return nextDate;
      return current;
    });
    setBookingFeedback(null);
  };

  const handleReturnDateSelect = (date) => {
    if (!date) return;
    const nextDate = parseDateValue(date);
    if (!nextDate) return;
    setSelectedReturnDate(nextDate);
    setReturnVisibleMonth(nextDate);
    setBookingFeedback(null);
  };

  const handleTripTypeChange = (event) => {
    const nextType = event.target.value;
    setTripType(nextType);
    if (nextType === "oneway") {
      setSelectedReturnDate(null);
    } else if (selectedTravelDate) {
      setReturnVisibleMonth(selectedTravelDate);
    }
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
      setAvailabilityError(
        "No pudimos obtener las fechas disponibles en este momento. Intentá nuevamente más tarde."
      );
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

  const loadReviews = async (productId, { silent = false } = {}) => {
    if (!productId) {
      setReviews([]);
      setReviewsError("");
      setReviewsLoading(false);
      return;
    }

    setReviewsError("");
    if (!silent) {
      setReviewsLoading(true);
    }

    try {
      const data = await getProductReviews(productId);
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando rese\u00f1as:", err);
      setReviews([]);
      setReviewsError("No se pudieron cargar las valoraciones.");
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (!vuelo?.localProductId) {
      setReviews([]);
      setReviewsError("");
      setReviewsLoading(false);
      return;
    }

    loadReviews(vuelo.localProductId);
  }, [vuelo?.localProductId]);

  useEffect(() => {
    checkReviewEligibility();
  }, [user, vuelo?.localProductId]);

  useEffect(() => {
    if (!vuelo) return;
    const initialDate = getInitialTravelDate(vuelo);
    setSelectedTravelDate(initialDate);
    setVisibleMonth(initialDate);
    setSelectedReturnDate(null);
    setReturnVisibleMonth(initialDate);
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
      console.error("Error cargando rese\u00f1as:", err);
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
      alert("Debes iniciar sesi\u00f3n para agregar favoritos.");
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
      alert("Debes iniciar sesi\u00f3n para valorar este vuelo.");
      navigate("/login");
      return;
    }

    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      setReviewsError("Tu sesi\u00f3n expir\u00f3. Inicia sesi\u00f3n nuevamente.");
      navigate("/login");
      return;
    }

    if (!vuelo?.localProductId) {
      setReviewsError("Este vuelo no est\u00e1 disponible para valoraciones.");
      return;
    }

    if (!canReview) {
      setReviewsError(
        reviewGateMessage || "Necesitas una reserva finalizada para dejar tu rese\u00f1a."
      );
      return;
    }

    if (!ratingValue) {
      setReviewsError("Selecciona una puntuaci\u00f3n antes de publicar tu rese\u00f1a.");
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
      setReviewsError("");
      setRatingValue(0);
      setHoverRating(0);
      setReviewComment("");
    } catch (err) {
      console.error("Error enviando rese\u00f1a:", err);
      const message = err?.message || "No se pudo publicar la rese\u00f1a.";
      setReviewsError(message);
      if (/token|autenticado|sesion/i.test(String(message))) {
        navigate("/login");
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      alert("Debes iniciar sesi\u00f3n para reservar un vuelo.");
      navigate("/login");
      return;
    }

    if (!vuelo?.localProductId) {
      alert("Este vuelo no est\u00e1 disponible para reserva directa.");
      return;
    }

    if (!selectedDateISO) {
      setBookingFeedback({
        type: "error",
        message: "Seleccioná una fecha de salida antes de reservar.",
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

    if (isRoundTrip && !selectedReturnDateISO) {
      setBookingFeedback({
        type: "error",
        message: "Seleccioná una fecha de regreso para continuar con el viaje ida y vuelta.",
      });
      return;
    }

    if (isRoundTrip && selectedReturnDateBooked) {
      setBookingFeedback({
        type: "error",
        message: "La fecha de regreso seleccionada no está disponible. Elegí otra para continuar.",
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
      await checkReviewEligibility();
      setBookingFeedback({
        type: "success",
        message: isRoundTrip
          ? `Reserva creada para la salida del ${selectedDateLabel}. Regreso seleccionado: ${selectedReturnDateLabel}.`
          : `Reserva creada para ${selectedDateLabel}.`,
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
      <div className="dv-page">
        <div className="dv-container">
          <div className="dv-state">
            <p className="dv-muted">Cargando detalle del vuelo...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!vuelo || loadError) {
    return (
      <div className="dv-page">
        <div className="dv-container">
          <div className="dv-state dv-state-error">
            <p className="dv-muted">{loadError || "No se encontró el vuelo."}</p>
            <button type="button" className="dv-link-btn" onClick={handleBack}>
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dv-page">
      <div className="dv-container">
        <section
          className="dv-hero"
          style={{ backgroundImage: `url("${heroImage}")` }}
          role="img"
          aria-label={`Vuelo ${vuelo.origen} a ${vuelo.destino}`}
        >
          <div className="dv-hero-overlay" />
          <div className="dv-hero-topbar">
            <button
              type="button"
              className="dv-back-button"
              onClick={handleBack}
              aria-label="Volver a la página anterior"
            >
              <FaChevronLeft />
            </button>
          </div>
          <div className="dv-hero-text">
            <span className="dv-hero-label">Premium Experience</span>
            <h1 className="dv-hero-title">{heroTitle}</h1>
            <p className="dv-hero-subtitle">{heroSubtitle}</p>
          </div>
        </section>

        <section className="dv-section dv-description">
          <h2 className="dv-section-title">Descripción</h2>
          <p className="dv-description-text">{descriptionText}</p>
        </section>

        <section className="dv-section dv-features">
          <h2 className="dv-section-title">Características del vuelo</h2>
          <div className="dv-features-grid">
            {featureHighlights.map((feature, index) => {
              const Icon = resolveFeatureIcon(feature.label, feature.iconName);
              return (
                <div key={`${feature.label}-${index}`} className="dv-feature-card">
                  <span className="dv-feature-icon">{Icon ? <Icon /> : null}</span>
                  <div className="dv-feature-text">
                    <span className="dv-feature-title">{feature.label}</span>
                    {feature.value ? <span className="dv-feature-value">{feature.value}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="dv-section dv-policies">
          <h2 className="dv-section-title">Políticas de uso</h2>
          <ul className="dv-policy-list">
            {POLICY_ITEMS.map((policy) => (
              <li key={policy.title} className="dv-policy-item">
                <span className="dv-policy-title">{policy.title}</span>
                <span className="dv-policy-desc">{policy.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="dv-section dv-dates">
          <h2 className="dv-section-title">Disponibilidad y fechas</h2>
          <div className="dv-dates-card">
            <div className="dv-dates-info">
              <div className="dv-trip-toggle" role="radiogroup" aria-label="Tipo de viaje">
                <label className={`dv-trip-option ${!isRoundTrip ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="tripType"
                    value="oneway"
                    checked={!isRoundTrip}
                    onChange={handleTripTypeChange}
                  />
                  <span>Solo ida</span>
                </label>
                <label className={`dv-trip-option ${isRoundTrip ? "is-active" : ""}`}>
                  <input
                    type="radio"
                    name="tripType"
                    value="roundtrip"
                    checked={isRoundTrip}
                    onChange={handleTripTypeChange}
                  />
                  <span>Ida y vuelta</span>
                </label>
              </div>

              <div className="dv-dates-summary-list">
                <div className="dv-dates-summary-item">
                  <span className="dv-dates-label">Fecha de salida</span>
                  <strong className="dv-dates-value">{selectedDateLabel}</strong>
                  <span className={`dv-status ${selectedDateBooked ? "is-booked" : "is-available"}`}>
                    {selectedDateBooked ? "Ocupada" : "Disponible"}
                  </span>
                </div>

                {isRoundTrip && (
                  <div className="dv-dates-summary-item">
                    <span className="dv-dates-label">Fecha de regreso</span>
                    <strong className="dv-dates-value">{selectedReturnDateLabel}</strong>
                    <span
                      className={`dv-status ${
                        !selectedReturnDateISO
                          ? "is-pending"
                          : selectedReturnDateBooked
                            ? "is-booked"
                            : "is-available"
                      }`}
                    >
                      {!selectedReturnDateISO
                        ? "Pendiente"
                        : selectedReturnDateBooked
                          ? "Ocupada"
                          : "Disponible"}
                    </span>
                  </div>
                )}
              </div>

              <p className="dv-dates-help">{dateSelectionHelp}</p>
              <div className="dv-dates-legend" aria-label="Referencia de disponibilidad">
                <span className="dv-legend-item">
                  <span className="dv-legend-dot is-available" aria-hidden="true" />
                  Disponible
                </span>
                <span className="dv-legend-item">
                  <span className="dv-legend-dot is-booked" aria-hidden="true" />
                  Ocupada
                </span>
              </div>
            </div>
            <div className="dv-dates-picker">
              {availabilityLoading && <p className="dv-muted">Cargando fechas disponibles...</p>}

              {!availabilityLoading && availabilityError && (
                <div className="dv-inline-error" role="alert">
                  <span>{availabilityError}</span>
                  <button
                    type="button"
                    className="dv-link-btn"
                    onClick={() => loadAvailability(vuelo?.localProductId)}
                  >
                    Volver a intentar
                  </button>
                </div>
              )}

              {!availabilityLoading && !availabilityError && (
                <>
                  <div className={`dv-dates-picker-grid ${isRoundTrip ? "is-roundtrip" : ""}`}>
                    <fieldset className="dv-calendar-panel">
                      <div className="dv-calendar-head">
                        <span className="dv-dates-label">Fecha de salida</span>
                      </div>
                      <DayPicker
                        mode="single"
                        locale={es}
                        className="dv-daypicker"
                        selected={selectedTravelDate}
                        month={visibleMonth}
                        onMonthChange={setVisibleMonth}
                        onSelect={handleTravelDateSelect}
                        disabled={disabledMatchers}
                        modifiers={departureCalendarModifiers}
                        modifiersClassNames={{ booked: "dv-day-booked", available: "dv-day-available" }}
                        numberOfMonths={departureCalendarMonthCount}
                        pagedNavigation={departureCalendarMonthCount > 1}
                        showOutsideDays
                        fixedWeeks
                        components={{
                          Chevron: ({ orientation, className }) =>
                            orientation === "left" ? (
                              <FaChevronLeft className={className} />
                            ) : (
                              <FaChevronRight className={className} />
                            ),
                        }}
                      />
                    </fieldset>

                    {isRoundTrip && (
                      <fieldset
                        className="dv-calendar-panel"
                        disabled={!selectedTravelDate}
                        aria-disabled={!selectedTravelDate}
                      >
                        <div className="dv-calendar-head">
                          <span className="dv-dates-label">Fecha de regreso</span>
                          {!selectedTravelDate && (
                            <span className="dv-calendar-hint">Elegí una salida primero</span>
                          )}
                        </div>
                        <DayPicker
                          mode="single"
                          locale={es}
                          className="dv-daypicker"
                          selected={selectedReturnDate}
                          month={returnVisibleMonth}
                          onMonthChange={setReturnVisibleMonth}
                          onSelect={handleReturnDateSelect}
                          disabled={selectedTravelDate ? returnDisabledMatchers : [() => true]}
                          modifiers={returnCalendarModifiers}
                          modifiersClassNames={{ booked: "dv-day-booked", available: "dv-day-available" }}
                          numberOfMonths={1}
                          showOutsideDays
                          fixedWeeks
                          components={{
                            Chevron: ({ orientation, className }) =>
                              orientation === "left" ? (
                                <FaChevronLeft className={className} />
                              ) : (
                                <FaChevronRight className={className} />
                              ),
                          }}
                        />
                      </fieldset>
                    )}
                  </div>

                  {!vuelo?.localProductId && (
                    <p className="dv-muted">Este vuelo aún no tiene disponibilidad publicada para reserva directa.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        <section className="dv-section dv-booking">
          <h2 className="dv-section-title">Reserva</h2>
          <div className="dv-booking-card">
            <div className="dv-booking-price">
              <span className="dv-booking-label">Precio por persona</span>
              <strong className="dv-booking-amount">${vuelo.precioTotal}</strong>
              <span className="dv-booking-note">Precio por persona</span>
            </div>
            <div className="dv-booking-actions">
              <button
                type="button"
                className={`dv-btn dv-btn-secondary ${isFavorite ? "is-active" : ""}`}
                onClick={handleFavorite}
              >
                {isFavorite ? "Guardado" : "Guardar"}
              </button>
              <button type="button" className="dv-btn dv-btn-primary" onClick={handleBooking} disabled={!canReserve}>
                {bookingButtonLabel}
              </button>
            </div>
          </div>
          {bookingFeedback && (
            <div className={`dv-feedback ${bookingFeedback.type === "success" ? "is-success" : "is-error"}`}>
              {bookingFeedback.type === "success" ? <FaCheckCircle /> : <FaExclamationCircle />}
              <span>{bookingFeedback.message}</span>
            </div>
          )}
        </section>

        <section className="dv-section dv-gallery">
          <h2 className="dv-section-title">Galería</h2>
          {galleryId ? (
            <Link to={`/galeria/${galleryId}`} className="dv-gallery-button">
              Ver galería de imágenes
            </Link>
          ) : (
            <button type="button" className="dv-gallery-button" disabled>
              Galería no disponible
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

