import React, { useMemo, useState } from "react";
import { FaTimes, FaWhatsapp } from "react-icons/fa";
import "./FloatingWhatsApp.css";

const DEFAULT_WHATSAPP = "5491155550101";

const sanitizePhone = (value) => String(value || "").replace(/[^\d]/g, "");

export default function FloatingWhatsApp() {
  const [error, setError] = useState("");
  const phone = useMemo(
    () => sanitizePhone(import.meta.env.VITE_PROVIDER_WHATSAPP || DEFAULT_WHATSAPP),
    []
  );

  const handleOpenWhatsapp = () => {
    if (!phone) {
      setError("No se pudo iniciar la comunicación");
      return;
    }

    const message = encodeURIComponent(
      "Hola, quiero consultar disponibilidad y reservas en JetSetter."
    );
    const url = `https://wa.me/${phone}?text=${message}`;

    try {
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        window.location.href = url;
      }
      setError("");
    } catch (err) {
      console.error("No se pudo abrir WhatsApp:", err);
      setError("No se pudo iniciar la comunicación");
    }
  };

  return (
    <>
      <button
        type="button"
        className="floating-whatsapp"
        onClick={handleOpenWhatsapp}
        aria-label="Contactar por WhatsApp"
      >
        <FaWhatsapp />
      </button>

      {error && (
        <div className="floating-whatsapp-toast" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="floating-whatsapp-toast-close"
            aria-label="Cerrar mensaje"
            onClick={() => setError("")}
          >
            <FaTimes />
          </button>
        </div>
      )}
    </>
  );
}
