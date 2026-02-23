// Recomendaciones.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";
import { Link } from "react-router-dom";

import VueloCards from "../../components/VueloCards"; // usamos VueloCard directamente
import productService from "../../services/productService";
import { getSafeIcon } from "../../utils/iconRegistry";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./Recomendaciones.css";

export default function Recomendaciones({ origen, destino, fecha }) {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  const recomendaciones = useMemo(() => {
    const shuffled = [...productos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20).map((p) => {
      const categoryName = p.category?.name || "Sin categoría";
      const CategoryIcon = getSafeIcon(categoryName);
      return {
        ...p,
        categoryName,
        CategoryIcon,
        aerolinea: p.name.split("→")[0] || "Desconocida",
        numeroVuelo: p.name.split("→")[1] || "000",
        caracteristicas: p.features?.map(f => f.name) || ["Clase: Lite", "Equipaje incluido: No"]
      };
    });
  }, [productos]);

  if (loading) return <p>Cargando recomendaciones...</p>;
  if (error) return <p>{error}</p>;
  if (recomendaciones.length === 0) return <p>No hay recomendaciones disponibles.</p>;

  return (
    <section className="recomendaciones-section">
      <h2 className="titulo-reco">Recomendaciones</h2>
      <div className="reco-wrapper">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, A11y]}
          spaceBetween={20}
          slidesPerView={3}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          loop
        >
          {recomendaciones.map((v, index) => (
       <SwiperSlide key={v.id || index}>
         <Link to={`/vuelo/${v.id}`} className="reco-link" state={{ vuelo: v }}>
           <VueloCards
             vuelo={v}
             compact={false}   // usamos completo para mostrar imagen
             showImage={true}  // mostramos la imagen real del vuelo
             IconComponent={null}
              miniCard={true}// no usamos icono de categoría
           />

           {/* 🔹 Bloque comentado para futuras opiniones / estrellas */}
           {/*
           <div className="reco-rating">
             <span>⭐⭐⭐⭐☆</span>  // ejemplo estático
             <p>4.0 (12 opiniones)</p>
           </div>
           */}
         </Link>
       </SwiperSlide>

          ))}
        </Swiper>
      </div>
    </section>
  );
}
