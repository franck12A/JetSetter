// Recomendaciones.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, A11y } from "swiper/modules";
import { Link } from "react-router-dom";

import productService from "../../services/productService";
import CarouselCard from "../CarouselCard/CarouselCard";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./Recomendaciones.css";

export default function Recomendaciones({ vuelos = [], origen, destino, fecha }) {
  const [productos, setProductos] = useState(vuelos);
  const [loading, setLoading] = useState(vuelos && vuelos.length > 0 ? false : true);
  const [error, setError] = useState("");
  const MAX_RECOS = 10;

  const shuffle = (items) => {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const uniqueById = (items) => {
    const seen = new Set();
    return items.filter((item) => {
      const id = item?.id ?? item?.productId;
      if (id == null || seen.has(id)) return false;
      seen.add(id);
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

  const recomendaciones = useMemo(() => {
    const unique = uniqueById(Array.isArray(productos) ? productos : []);
    const shuffled = shuffle(unique);
    return shuffled.slice(0, MAX_RECOS).map((p) => {
      const nameParts = (p.name || "").split("->").map((s) => s.trim());
      return {
        ...p,
        aerolinea: nameParts[0] || "Desconocida",
        numeroVuelo: nameParts[1] || "000",
        caracteristicas: p.features?.map((f) => f.name) || ["Clase: Lite", "Equipaje incluido: No"],
      };
    });
  }, [productos]);

  const pages = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < recomendaciones.length; i += MAX_RECOS) {
      chunks.push(recomendaciones.slice(i, i + MAX_RECOS));
    }
    return chunks;
  }, [recomendaciones]);

  if (loading) return <p>Cargando recomendaciones...</p>;
  if (error) return <p>{error}</p>;
  if (recomendaciones.length === 0) return <p>No hay recomendaciones disponibles.</p>;

  return (
    <section className="recomendaciones-section">
      <div className="reco-header">
        <h2 className="titulo-reco">Popular Destinations</h2>
        <a href="#/resultados" className="ver-todas-reco">See all</a>
      </div>
      <div className="reco-wrapper">
        <Swiper
          modules={[Navigation, Pagination, A11y]}
          slidesPerView={1}
          spaceBetween={24}
          pagination={{ clickable: true }}
          navigation
          loop={pages.length > 1}
        >
          {pages.map((chunk, pageIndex) => (
            <SwiperSlide key={`reco-page-${pageIndex}`}>
              <div className="reco-grid">
                {chunk.map((v, index) => (
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
                    />
                  </Link>
                ))}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
}
