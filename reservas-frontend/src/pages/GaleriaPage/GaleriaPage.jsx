import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import productService from "../../services/productService";
import "./GaleriaPage.css";

const FALLBACK_IMAGE = "/assets/imagenespaises/argentina_1.jpg";
const GRID_COUNT = 5;
const FETCH_COUNT = 10;
const UNKNOWN_LABELS = new Set(["desconocido", "destino"]);

export default function GaleriaPage() {
  const { id } = useParams();
  const [gridImages, setGridImages] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [creditos, setCreditos] = useState([]);
  const [titulo, setTitulo] = useState("Destino");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
      const countryCode = typeof vuelo?.country === "string" && vuelo.country.length === 3
        ? vuelo.country
        : null;
      setTitulo(nombre);

      const localImages = [];
      if (Array.isArray(vuelo?.imagesBase64)) localImages.push(...vuelo.imagesBase64);
      if (Array.isArray(vuelo?.imagenesPais)) localImages.push(...vuelo.imagenesPais);
      if (vuelo?.image) localImages.push(vuelo.image);
      if (vuelo?.imagenPrincipal) localImages.push(vuelo.imagenPrincipal);
      const uniqueLocal = Array.from(new Set(localImages.filter(Boolean)));

      const normalizedName = typeof nombre === "string" ? nombre.trim().toLowerCase() : "";
      const fallbackQuery = vuelo?.destino || vuelo?.origen || nombre;
      const query = UNKNOWN_LABELS.has(normalizedName) ? fallbackQuery : nombre;

      let apiData = [];
      try {
        apiData = await productService.getCountryImages({
          country: countryCode || nombre,
          query,
          count: FETCH_COUNT,
        });
      } catch {
        apiData = [];
      }

      const apiImages = apiData.map((item) => item.url).filter(Boolean);
      const mergedAll = [...uniqueLocal, ...apiImages].filter(Boolean);
      const finalAll = mergedAll.length ? mergedAll : [FALLBACK_IMAGE];

      const grid = [...finalAll];
      while (grid.length < GRID_COUNT) {
        grid.push(FALLBACK_IMAGE);
      }

      setAllImages(finalAll);
      setGridImages(grid.slice(0, GRID_COUNT));

      const usedExternal = new Set(finalAll.filter((src) => /^https?:\/\//.test(src)));
      const credits = apiData.filter((item) => item.url && usedExternal.has(item.url));
      setCreditos(credits);

      setLoading(false);
    };

    loadGaleria();
  }, [id]);

  const cards = useMemo(() => {
    const source = gridImages.length
      ? gridImages
      : Array.from({ length: GRID_COUNT }, () => FALLBACK_IMAGE);

    return source.slice(0, GRID_COUNT).map((img, index) => ({
      id: `${index}-${img}`,
      imagen: img,
      titulo,
      destacado: index === 0,
      badge: "MAS POPULAR",
      cta: index === GRID_COUNT - 1 ? "Ver m\u00e1s" : null,
    }));
  }, [gridImages, titulo]);

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
                <button type="button" className="galeria-btn" onClick={() => setShowModal(true)}>
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

      {showModal && (
        <div className="galeria-modal" role="dialog" aria-modal="true">
          <div className="galeria-modal__backdrop" onClick={() => setShowModal(false)} />
          <div className="galeria-modal__content">
            <div className="galeria-modal__header">
              <h2>Galeria completa</h2>
              <button
                type="button"
                className="galeria-modal__close"
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
              >
                {"\u00d7"}
              </button>
            </div>
            <div className="galeria-modal__grid">
              {allImages.map((src, index) => (
                <img key={`${index}-${src}`} src={src} alt={`${titulo} ${index + 1}`} />
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}



