// Recomendaciones.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaShareAlt } from "react-icons/fa";

import productService from "../../services/productService";
import { normalizeAirlineName } from "../../utils/flightMetadata";
import CarouselCard from "../CarouselCard/CarouselCard";
import { addFavorite, getUserFavorites, removeFavorite } from "../../services/favoritesApi";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Recomendaciones.css";

export default function Recomendaciones({ vuelos = [], onShare }) {
  const [productos, setProductos] = useState(vuelos);
  const [loading, setLoading] = useState(vuelos && vuelos.length > 0 ? false : true);
  const [error, setError] = useState("");
  const [favoriteIds, setFavoriteIds] = useState([]);
  const MAX_RECOS = 10;
  const CARDS_PER_PAGE = 4;

  const shuffle = (items) => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const uniqueById = (items) => {
    const seenIds = new Set();
    const seenDestinos = new Set();
    return items.filter((item) => {
      const id = item?.id ?? item?.productId;
      const destSplit = item?.name ? item.name.split("->")[1] : null;
      const destino = (item?.destino || destSplit || "").trim().toUpperCase();

      if (id == null || seenIds.has(id)) return false;
      if (destino && seenDestinos.has(destino)) return false;

      seenIds.add(id);
      if (destino) seenDestinos.add(destino);
      return true;
    });
  };

  useEffect(() => {
    // si vienen vuelos por props, los usamos directamente
    if (vuelos && vuelos.length > 0) {
      setProductos(vuelos);
      setLoading(false);
      return;
    }

    const loadProductos = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await productService.getRandomProducts(MAX_RECOS);
        setProductos(data);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setError("No se pudieron cargar las recomendaciones");
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    loadProductos();
  }, [vuelos]);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
          setFavoriteIds([]);
          return;
        }
        const favs = await getUserFavorites();
        const ids = (favs || []).map((item) => Number(item.id)).filter((id) => Number.isInteger(id));
        setFavoriteIds(ids);
      } catch (err) {
        console.error("Error cargando favoritos en recomendaciones:", err);
      }
    };

    loadFavorites();
  }, []);

  const recomendaciones = useMemo(() => {
    const unique = uniqueById(Array.isArray(productos) ? productos : []);
    const shuffled = shuffle(unique);
    return shuffled.slice(0, MAX_RECOS).map((p) => {
      const airlineName = normalizeAirlineName(p.airlineName || p.aerolinea || p.airline);
      const flightNumber = p.flightNumber || p.numeroVuelo || p.flight_number || "No disponible";
      return {
        ...p,
        airlineName,
        flightNumber,
        aerolinea: airlineName,
        numeroVuelo: flightNumber,
        caracteristicas: p.features?.map((f) => f.name) || ["Clase: Lite", "Equipaje incluido: No"],
      };
    });
  }, [productos]);

  const resolveProductId = (item) => {
    const raw = item?.productId ?? item?.id;
    const parsed = Number(raw);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  };

  const toggleFavorite = async (event, item) => {
    event.preventDefault();
    event.stopPropagation();

    const user = JSON.parse(localStorage.getItem("user") || "null");
    const token = localStorage.getItem("token");
    if (!user || !token) {
      alert("Debes iniciar sesion para agregar favoritos.");
      return;
    }

    const productId = resolveProductId(item);
    if (!productId) {
      alert("Este vuelo no esta guardado en la BD para favoritos.");
      return;
    }

    const isFav = favoriteIds.includes(productId);

    try {
      if (isFav) {
        await removeFavorite(productId);
      } else {
        await addFavorite(productId);
      }

      setFavoriteIds((prev) =>
        isFav ? prev.filter((id) => id !== productId) : [...prev, productId]
      );

      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      const nextFavorites = isFav
        ? (stored.favorites || []).filter((id) => Number(id) !== productId)
        : [...(stored.favorites || []), productId];
      stored.favorites = nextFavorites;
      localStorage.setItem("user", JSON.stringify(stored));
    } catch (err) {
      console.error("Error actualizando favorito:", err);
      alert("No se pudo actualizar el favorito.");
    }
  };

  const handleShare = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    if (onShare) onShare(item);
  };

  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < recomendaciones.length; i += CARDS_PER_PAGE) {
      chunks.push(recomendaciones.slice(i, i + CARDS_PER_PAGE));
    }
    return chunks;
  }, [recomendaciones]);

  if (loading) return <p>Cargando recomendaciones...</p>;
  if (error) return <p>{error}</p>;
  if (recomendaciones.length === 0) return <p>No hay recomendaciones disponibles.</p>;

  return (
    <section className="recomendaciones-section">
      <div className="reco-header">
        <h2 className="titulo-reco">Destinos populares</h2>
        <a href="#/resultados" className="ver-todas-reco">Ver todos</a>
      </div>
      <div className="reco-wrapper">
        <Swiper
          modules={[Navigation, Pagination, A11y, Autoplay]}
          slidesPerView={1}
          spaceBetween={24}
          pagination={{ clickable: true }}
          navigation
          loop={pages.length > 1}
          autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        >
          {pages.map((chunk, pageIndex) => (
            <SwiperSlide key={`reco-page-${pageIndex}`}>
              <div className="reco-grid">
                {chunk.map((v, index) => {
                  const productId = resolveProductId(v);
                  const isFavorite = productId ? favoriteIds.includes(productId) : false;

                  return (
                    <Link
                      key={v.id || index}
                      to={`/vuelo/${v.productId || v.id}`}
                      className="reco-link"
                      state={{ vuelo: { ...v, productId: v.productId || v.id } }}
                    >
                      <CarouselCard
                        image={v.imagenPrincipal}
                        subtitle={`${v.origen} -> ${v.destino}`}
                        title={v.destino}
                        price={v.precioTotal}
                        actions={
                          <>
                            <button
                              type="button"
                              className={`carousel-action ${isFavorite ? "is-active" : ""}`}
                              onClick={(event) => toggleFavorite(event, v)}
                              aria-label="Marcar como favorito"
                            >
                              {isFavorite ? <FaHeart /> : <FaRegHeart />}
                            </button>
                            <button
                              type="button"
                              className="carousel-action"
                              onClick={(event) => handleShare(event, v)}
                              aria-label="Compartir vuelo"
                            >
                              <FaShareAlt />
                            </button>
                          </>
                        }
                      />
                    </Link>
                  );
                })}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
