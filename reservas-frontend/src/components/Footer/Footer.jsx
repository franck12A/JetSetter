import React from "react";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-left">
          <img
            src="/assets/logoJettSeter.png"
            alt="Logo de la pagina"
            className="footer-logo"
          />
          <div className="footer-text">
            <span className="footer-brand">JettSetter</span>
            <span className="footer-copy">Copyright {year}. Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
