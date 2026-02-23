import React from "react";
import "./Footer.css";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer-container">
      <div className="footer-left">
        <img src="/assets/logopaginapro.png" alt="Logo de la página" className="footer-logo" />
        <span>© {year} JettSetter</span>
      </div>
      <div className="footer-right">
        <span>Información de contacto | Redes sociales</span>
      </div>
    </footer>
  );
}
