import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPlane,
} from "react-icons/fa";
import productService from "../../services/productService";
import { createBooking, getProductBookedDates } from "../../services/bookingsApi";
import { getVueloImage } from "../../utils/images";
import "./Reserva.css";

const toISODateLocal = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const formatDateLabel = (value) => {
  const date = parseDateOnly(value);
  if (!date) return "Sin seleccionar";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const buildRangeLabel = (startDate, endDate, isRoundTrip) => {
  if (!startDate) return "Selecciona tus fechas";
  if (!isRoundTrip || !endDate) return `Salida: ${formatDateLabel(startDate)}`;
  return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const normalizeProduct = (product) => {
  if (!product) return null;
  const route = String(product.name || "")
    .replace(/^Vuelo\s+/i, "")
    .split(/->|→/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    ...product,
    title: product.name || "Vuelo disponible",
    location: product.country || route[1] || "Destino a confirmar",
    description:
      product.description ||
      "Reserva este vuelo y recibe la confirmación con todos los datos relevantes de tu viaje.",
    mainImage: getVueloImage(product),
    galleryImages: [
      getVueloImage(product),
      ...(Array.isArray(product.imagesBase64) ? product.imagesBase64 : []),
      ...(Array.isArray(product.imagenesPais) ? product.imagenesPais : []),
    ].filter(Boolean).slice(0, 3),
  };
};

export default function Reserva() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => getStoredUser(), []);
  const bookingSelection = location.state?.bookingSelection || {};

  const [product, setProduct] = useState(() => normalizeProduct(location.state?.vuelo));
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [bookedDates, setBookedDates] = useState([]);
  const [tripType, setTripType] = useState(
    bookingSelection.tripType === "roundtrip" || bookingSelection.returnDateISO ? "roundtrip" : "oneway"
  );
  const [startDate, setStartDate] = useState(bookingSelection.travelDateISO || "");
  const [endDate, setEndDate] = useState(bookingSelection.returnDateISO || "");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) return;
    navigate("/login", {
      replace: true,
      state: {
        message:
          "Debes iniciar sesión para realizar una reserva. Si no tienes cuenta, puedes registrarte.",
        redirectTo: `/reserva/${id}`,
        redirectState: location.state || null,
      },
    });
  }, [id, location.state, navigate, user]);

  useEffect(() => {
    if (!id) {
      setLoadError("No se encontró el producto a reservar.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProduct = async () => {
      setLoading(true);
      setLoadError("");
      try {
        const data = await productService.getById(id);
        if (cancelled) return;
        setProduct(normalizeProduct(data));
        if (!startDate) {
          setStartDate(toISODateLocal(data?.departureDate || new Date()));
        }
      } catch (err) {
        console.error("Error cargando reserva:", err);
        if (!cancelled) {
          setLoadError("No se pudo cargar la información de esta reserva.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProduct();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const loadAvailability = async () => {
      setAvailabilityLoading(true);
      setAvailabilityError("");
      try {
        const dates = await getProductBookedDates(product?.id || id);
        if (!cancelled) {
          setBookedDates(Array.isArray(dates) ? dates : []);
        }
      } catch (err) {
        console.error("Error cargando disponibilidad de reserva:", err);
        if (!cancelled) {
          setAvailabilityError(
            "No se pudo validar la disponibilidad en este momento. Intentalo nuevamente."
          );
        }
      } finally {
        if (!cancelled) {
          setAvailabilityLoading(false);
        }
      }
    };

    loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [id, product?.id]);

  const bookedDateSet = useMemo(() => new Set(bookedDates), [bookedDates]);
  const isRoundTrip = tripType === "roundtrip";
  const selectedRangeLabel = useMemo(
    () => buildRangeLabel(startDate, endDate, isRoundTrip),
    [endDate, isRoundTrip, startDate]
  );
  const unavailableDatesLabel = useMemo(
    () => bookedDates.slice(0, 8).map((date) => formatDateLabel(date)),
    [bookedDates]
  );

  const rangeIncludesUnavailableDate = (from, to) => {
    const start = parseDateOnly(from);
    const end = parseDateOnly(to || from);
    if (!start || !end) return false;

    const cursor = new Date(start.getTime());
    while (cursor <= end) {
      if (bookedDateSet.has(toISODateLocal(cursor))) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  };

  const validateSelection = () => {
    const today = toISODateLocal(new Date());

    if (!startDate) return "Selecciona una fecha de salida.";
    if (startDate < today) return "No se permiten fechas pasadas.";
    if (isRoundTrip && !endDate) return "Selecciona una fecha de regreso.";
    if (isRoundTrip && endDate < startDate) {
      return "La fecha de regreso no puede ser anterior a la salida.";
    }
    if (rangeIncludesUnavailableDate(startDate, isRoundTrip ? endDate : startDate)) {
      return "El rango incluye fechas no disponibles para este vuelo.";
    }
    return "";
  };

  const handleConfirmBooking = async () => {
    const validationError = validateSelection();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const booking = await createBooking({
        productId: product?.id || Number(id),
        dateStr: startDate,
        returnDateStr: isRoundTrip ? endDate : "",
        passengers: 1,
      });

      navigate(`/reserva/confirmacion/${booking.id}`, {
        replace: true,
        state: {
          booking,
          product,
          reservationSummary: {
            startDate,
            endDate: isRoundTrip ? endDate : "",
            isRoundTrip,
          },
        },
      });
    } catch (err) {
      console.error("Error confirmando reserva:", err);
      const detail = err?.message ? ` ${err.message}` : "";
      setSubmitError(`No se pudo completar la reserva. Intentalo nuevamente.${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="reserva-page">
        <div className="reserva-shell">
          <p className="reserva-loading">Cargando reserva...</p>
        </div>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="reserva-page">
        <div className="reserva-shell reserva-shell-error">
          <p>{loadError || "No se pudo cargar esta reserva."}</p>
          <button type="button" className="reserva-back-btn" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reserva-page">
      <div className="reserva-shell">
        <div className="reserva-topbar">
          <button type="button" className="reserva-back-btn" onClick={() => navigate(-1)}>
            <FaChevronLeft />
            Volver
          </button>
          <span className="reserva-step">Reserva</span>
        </div>

        <div className="reserva-layout">
          <section className="reserva-card reserva-product-card">
            <div className="reserva-product-visual">
              <img src={product.mainImage} alt={product.title} className="reserva-product-image" />
              {product.galleryImages?.length > 1 && (
                <div className="reserva-product-gallery">
                  {product.galleryImages.map((image, index) => (
                    <img
                      key={`${image}-${index}`}
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="reserva-product-thumb"
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="reserva-product-copy">
              <h1>{product.title}</h1>
              <p className="reserva-product-location">
                <FaMapMarkerAlt />
                {product.location}
              </p>
              <p className="reserva-product-description">{product.description}</p>
            </div>
          </section>

          <section className="reserva-card">
            <div className="reserva-section-head">
              <h2>Datos del usuario</h2>
              <FaEnvelope />
            </div>
            <div className="reserva-user-grid">
              <div>
                <span className="reserva-label">Nombre</span>
                <strong>{user.firstName || "Sin nombre"}</strong>
              </div>
              <div>
                <span className="reserva-label">Apellido</span>
                <strong>{user.lastName || "Sin apellido"}</strong>
              </div>
              <div className="is-full">
                <span className="reserva-label">Correo electrónico</span>
                <strong>{user.email || "Sin email"}</strong>
              </div>
            </div>
          </section>

          <section className="reserva-card">
            <div className="reserva-section-head">
              <h2>Fechas de la reserva</h2>
              <FaCalendarAlt />
            </div>

            <div className="reserva-trip-switch" role="radiogroup" aria-label="Tipo de viaje">
              <button
                type="button"
                className={`reserva-trip-btn ${!isRoundTrip ? "is-active" : ""}`}
                onClick={() => {
                  setTripType("oneway");
                  setEndDate("");
                  setSubmitError("");
                }}
              >
                Solo ida
              </button>
              <button
                type="button"
                className={`reserva-trip-btn ${isRoundTrip ? "is-active" : ""}`}
                onClick={() => setTripType("roundtrip")}
              >
                Ida y vuelta
              </button>
            </div>

            <div className="reserva-form-grid">
              <label className="reserva-field">
                <span className="reserva-label">Salida</span>
                <input
                  type="date"
                  value={startDate}
                  min={toISODateLocal(new Date())}
                  onChange={(event) => {
                    setStartDate(event.target.value);
                    setSubmitError("");
                  }}
                />
              </label>

              <label className="reserva-field">
                <span className="reserva-label">Regreso</span>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || toISODateLocal(new Date())}
                  disabled={!isRoundTrip}
                  onChange={(event) => {
                    setEndDate(event.target.value);
                    setSubmitError("");
                  }}
                />
              </label>
            </div>

            <div className="reserva-summary-box">
              <span className="reserva-summary-label">Rango seleccionado</span>
              <strong>{selectedRangeLabel}</strong>
            </div>

            {availabilityLoading && <p className="reserva-muted">Validando disponibilidad...</p>}

            {!availabilityLoading && unavailableDatesLabel.length > 0 && (
              <div className="reserva-availability-box">
                <span className="reserva-label">Fechas no disponibles</span>
                <p>{unavailableDatesLabel.join(" · ")}</p>
              </div>
            )}

            {availabilityError && <p className="reserva-inline-error">{availabilityError}</p>}
            {submitError && <p className="reserva-inline-error">{submitError}</p>}

            <div className="reserva-actions">
              <Link to={`/vuelo/${product.id}`} state={{ vuelo: product }} className="reserva-secondary-btn">
                Volver al detalle
              </Link>
              <button
                type="button"
                className="reserva-primary-btn"
                onClick={handleConfirmBooking}
                disabled={submitting || availabilityLoading}
              >
                {submitting ? "Confirmando..." : "Confirmar reserva"}
              </button>
            </div>
          </section>

          <section className="reserva-card reserva-summary-card">
            <div className="reserva-section-head">
              <h2>Resumen</h2>
              <FaPlane />
            </div>
            <ul className="reserva-summary-list">
              <li>
                <span>Producto</span>
                <strong>{product.title}</strong>
              </li>
              <li>
                <span>Ubicación</span>
                <strong>{product.location}</strong>
              </li>
              <li>
                <span>Fechas de uso</span>
                <strong>{selectedRangeLabel}</strong>
              </li>
              <li>
                <span>Email de confirmación</span>
                <strong>{user.email}</strong>
              </li>
            </ul>
            <div className="reserva-email-note">
              <FaCheckCircle />
              <p>
                Cuando confirmes, enviaremos un email con el detalle de la reserva y el contacto del proveedor.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
