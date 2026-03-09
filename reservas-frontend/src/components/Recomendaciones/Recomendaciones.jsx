// Recomendaciones.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";
import { Link } from "react-router-dom";

import productService from "../../services/productService";
import CarouselCard from "../CarouselCard/CarouselCard";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./Recomendaciones.css";

export default function Recomendaciones({ vuelos = [], origen, destino, fecha }) {
  const [productos, setProductos] = useState(vuelos);
  const [loading, setLoading] = useState(vuelos && vuelos.length > 0 ? false : true);
  const [error, setError] = useState("");

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
        const data = await productService.getAllProducts();
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
    const shuffled = [...productos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20).map((p) => {
      const nameParts = (p.name || "").split("→").map(s => s.trim());
      return {
        ...p,
        aerolinea: nameParts[0] || "Desconocida",
        numeroVuelo: nameParts[1] || "000",
        caracteristicas: p.features?.map(f => f.name) || ["Clase: Lite", "Equipaje incluido: No"]
      };
    });
  }, [productos]);

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
          modules={[Navigation, Pagination, Autoplay, A11y]}
          spaceBetween={20}
          slidesPerView={3}
          centeredSlides={true}
          centerInsufficientSlides={true}
          breakpoints={{
            320: { slidesPerView: 1, spaceBetween: 15 },
            768: { slidesPerView: 2, spaceBetween: 20 },
            1024: { slidesPerView: 3, spaceBetween: 20 }
          }}
          navigation={{
            prevEl: '.prev-btn',
            nextEl: '.next-btn',
          }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
        >
          {recomendaciones.map((v, index) => (
            <SwiperSlide key={v.id || index}>
              <Link to={`/vuelo/${v.id}`} className="reco-link" state={{ vuelo: v }}>
                <CarouselCard
                  image={v.imagenPrincipal}
                  subtitle={`${v.origen} → ${v.destino}`}
                  title={v.destino}
                  price={v.precioTotal}
                />
              </Link>
            </SwiperSlide>

          ))}
        </Swiper>
      </div>
    </section>
  );
}
