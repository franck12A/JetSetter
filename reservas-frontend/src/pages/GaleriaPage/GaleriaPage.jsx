import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import productService from "../../services/productService";
import "./GaleriaPage.css";

const FALLBACK_IMAGE = "/assets/imagenespaises/argentina_1.jpg";

export default function GaleriaPage() {
  const { id } = useParams();
  const [imagenes, setImagenes] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [titulo, setTitulo] = useState("Destino");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGaleria = async () => {
      setLoading(true);
      let vuelo = null;
      const numericId = Number(id);

      if (Number.isInteger(numericId) && numericId > 0) {
        try {
          vuelo = await productService.getById(numericId);
        } catch {
          vuelo = null;
        }
      }

      if (!vuelo) {
        try {
          vuelo = await productService.obtenerVueloPorIdAPI(id);
        } catch {
          vuelo = null;
        }
      }

      const nombre = vuelo?.paisDestino || vuelo?.country || vuelo?.destino || "Destino";
      setTitulo(nombre);

      const localImages = Array.isArray(vuelo?.imagenesPais) ? vuelo.imagenesPais : [];
      const uniqueLocal = Array.from(new Set(localImages.filter(Boolean)));

      let apiData = [];
      const missing = Math.max(0, 5 - uniqueLocal.length);

      if (missing > 0) {
        try {
          apiData = await productService.getCountryImages({ query: nombre, count: missing });
        } catch {
          apiData = [];
        }
      }

      const apiImages = apiData.map((item) => item.url).filter(Boolean);
      const merged = [...uniqueLocal, ...apiImages].filter(Boolean);

      while (merged.length < 5) {
        merged.push(FALLBACK_IMAGE);
      }

      const finalImages = merged.slice(0, 5);
      setImagenes(finalImages);

      const usedExternal = new Set(finalImages.filter((src) => /^https?:\/\//.test(src)));
      const credits = apiData.filter((item) => item.url && usedExternal.has(item.url));
      setCreditos(credits);

      setLoading(false);
    };

    loadGaleria();
  }, [id]);

  const cards = useMemo(() => {
    const source = imagenes.length ? imagenes : [
      FALLBACK_IMAGE,
      FALLBACK_IMAGE,
      FALLBACK_IMAGE,
      FALLBACK_IMAGE,
      FALLBACK_IMAGE,
    ];

    return source.slice(0, 5).map((img, index) => ({
      id: `${index}-${img}`,
      imagen: img,
      titulo,
      destacado: index === 0,
      badge: "MAS POPULAR",
      cta: index === 4 ? "Ver mas" : null,
    }));
  }, [imagenes, titulo]);

  return (
    <section className="galeria-page">
      <div className="galeria-shell">
        <header className="galeria-header">
          <span className="galeria-kicker">
            <span className="galeria-dot" />
            Explora el mundo
          </span>
          <h1>Galeria de {titulo}</h1>
          <p>
            Una seleccion de postales para inspirarte en tu proxima aventura.
          </p>
        </header>

        {loading && <p className="galeria-loading">Cargando galeria...</p>}

        <div className="galeria-grid" aria-busy={loading}>
          {cards.map((destino) => (
            <article
              key={destino.id}
              className={`galeria-card${destino.destacado ? " galeria-card--featured" : ""}${
                destino.cta ? " galeria-card--cta" : ""
              }`}
            >
              <img src={destino.imagen} alt={destino.titulo} />
              {destino.destacado && (
                <div className="galeria-overlay">
                  <span className="galeria-badge">{destino.badge}</span>
                  <h3>{destino.titulo}</h3>
                </div>
              )}
              {destino.cta && (
                <button type="button" className="galeria-btn">
                  {destino.cta}
                </button>
              )}
            </article>
          ))}
        </div>

        {creditos.length > 0 && (
          <div className="galeria-credits">
            <span>Creditos de imagenes:</span>
            {creditos.map((credito, index) => (
              <span key={`${credito.author || "autor"}-${index}`}>
                Foto por {credito.author || "Autor"} en{" "}
                <a
                  href={credito.sourceUrl || "https://unsplash.com"}
                  target="_blank"
                  rel="noreferrer"
                >
                  Unsplash
                </a>
                {credito.authorUrl ? (
                  <>
                    {" "}(
                    <a href={credito.authorUrl} target="_blank" rel="noreferrer">
                      perfil
                    </a>
                    )
                  </>
                ) : null}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
