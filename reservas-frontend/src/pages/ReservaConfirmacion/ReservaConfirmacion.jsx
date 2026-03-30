import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaCheckCircle, FaEnvelopeOpenText, FaPlaneDeparture } from "react-icons/fa";
import "./ReservaConfirmacion.css";

const formatDateLabel = (value) => {
  if (!value) return "Sin definir";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ReservaConfirmacion() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;
  const product = location.state?.product;
  const summary = location.state?.reservationSummary;

  return (
    <div className="reserva-confirm-page">
      <div className="reserva-confirm-card">
        <span className="reserva-confirm-icon">
          <FaCheckCircle />
        </span>
        <h1>Reserva realizada con éxito</h1>
        <p className="reserva-confirm-subtitle">
          Ya registramos tu reserva y enviamos la confirmación al email asociado a tu cuenta.
        </p>

        <div className="reserva-confirm-grid">
          <div className="reserva-confirm-item">
            <span className="reserva-confirm-label">Producto</span>
            <strong>{product?.title || product?.name || booking?.product?.name || "Vuelo reservado"}</strong>
          </div>
          <div className="reserva-confirm-item">
            <span className="reserva-confirm-label">Reserva</span>
            <strong>{booking?.id ? `#${booking.id}` : "Confirmada"}</strong>
          </div>
          <div className="reserva-confirm-item">
            <span className="reserva-confirm-label">Salida</span>
            <strong>{formatDateLabel(summary?.startDate || booking?.travelDate)}</strong>
          </div>
          <div className="reserva-confirm-item">
            <span className="reserva-confirm-label">Regreso</span>
            <strong>{formatDateLabel(summary?.endDate || booking?.returnDate)}</strong>
          </div>
        </div>

        <div className="reserva-confirm-note">
          <FaEnvelopeOpenText />
          <p>Revisa tu casilla para ver el detalle de la reserva, las fechas elegidas y el contacto del proveedor.</p>
        </div>

        <div className="reserva-confirm-actions">
          <button type="button" className="reserva-confirm-secondary" onClick={() => navigate("/")}>
            Ir al inicio
          </button>
          <Link to="/profile" className="reserva-confirm-primary">
            <FaPlaneDeparture />
            Ver mis reservas
          </Link>
        </div>
      </div>
    </div>
  );
}
