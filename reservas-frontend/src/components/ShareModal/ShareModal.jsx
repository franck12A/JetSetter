import React, { useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaInstagram, FaLink, FaTimes, FaTwitter, FaShareAlt } from "react-icons/fa";
import "./ShareModal.css";

const NETWORKS = [
  { id: "facebook", label: "Facebook", Icon: FaFacebookF },
  { id: "twitter", label: "Twitter / X", Icon: FaTwitter },
  { id: "instagram", label: "Instagram", Icon: FaInstagram },
];

const buildDefaultMessage = (data) => {
  if (!data) return "Mira este vuelo";
  const title = data.title || "Mira este vuelo";
  return `Mira este vuelo: ${title}`;
};

export default function ShareModal({ isOpen, onClose, data }) {
  const [selectedNetwork, setSelectedNetwork] = useState("facebook");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const shareUrl = data?.url || "";
  const shareImage = data?.image || "/assets/avionsito.png";
  const shareTitle = data?.title || "Compartir vuelo";
  const shareDescription = data?.description || "";

  useEffect(() => {
    if (!isOpen) return;
    setSelectedNetwork("facebook");
    setMessage(buildDefaultMessage(data));
    setFeedback("");
  }, [isOpen, data]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const encodedMessage = useMemo(() => encodeURIComponent(message.trim()), [message]);
  const encodedUrl = useMemo(() => encodeURIComponent(shareUrl), [shareUrl]);

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    if (!navigator.clipboard) {
      setFeedback("Selecciona y copia el enlace manualmente.");
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setFeedback("Enlace copiado al portapapeles.");
    } catch (err) {
      console.error("No se pudo copiar el enlace:", err);
      setFeedback("No se pudo copiar el enlace.");
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    const trimmedMessage = message.trim() || shareTitle;

    if (selectedNetwork === "instagram") {
      const combined = `${trimmedMessage} ${shareUrl}`.trim();
      if (!navigator.clipboard) {
        setFeedback("Copia el mensaje manualmente y pegalo en Instagram.");
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        return;
      }
      try {
        await navigator.clipboard.writeText(combined);
        setFeedback("Mensaje y enlace copiados. Pegalos en Instagram.");
      } catch (err) {
        console.error("No se pudo copiar el mensaje:", err);
        setFeedback("No se pudo copiar el mensaje.");
      }
      window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      return;
    }

    let targetUrl = "";
    if (selectedNetwork === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
    } else if (selectedNetwork === "twitter") {
      targetUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`;
    }

    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
      onClose?.();
    }
  };

  if (!isOpen || !data) return null;

  return (
    <div className="share-modal-overlay" onClick={onClose}>
      <div
        className="share-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Compartir producto"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="share-modal-close" onClick={onClose} aria-label="Cerrar">
          <FaTimes />
        </button>

        <div className="share-modal-preview">
          <div className="share-modal-image">
            <img
              src={shareImage}
              alt={shareTitle}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = "/assets/avionsito.png";
              }}
            />
          </div>
          <div className="share-modal-info">
            <h3>{shareTitle}</h3>
            <p>{shareDescription}</p>
            <div className="share-link-row">
              <FaLink />
              <input type="text" value={shareUrl} readOnly aria-label="Enlace del producto" />
              <button type="button" className="share-link-copy" onClick={handleCopyLink}>
                Copiar
              </button>
            </div>
          </div>
        </div>

        <div className="share-modal-form">
          <h4>Elegi donde compartir</h4>
          <div className="share-network-grid">
            {NETWORKS.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                className={`share-network-btn ${selectedNetwork === id ? "is-active" : ""}`}
                onClick={() => setSelectedNetwork(id)}
                aria-pressed={selectedNetwork === id}
              >
                <span className="share-network-icon">
                  <Icon />
                </span>
                <span>{label}</span>
              </button>
            ))}
          </div>

          <label className="share-message-label" htmlFor="share-message">
            Mensaje personalizado
          </label>
          <textarea
            id="share-message"
            className="share-message-textarea"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Agrega un mensaje para acompanar el contenido"
          />

          {feedback ? <p className="share-feedback">{feedback}</p> : null}

          <div className="share-actions">
            <button type="button" className="share-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="button" className="share-confirm" onClick={handleShare}>
              <FaShareAlt /> Compartir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
