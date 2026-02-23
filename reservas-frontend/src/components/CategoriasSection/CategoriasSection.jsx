import React, { useEffect, useState, useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay, A11y } from "swiper/modules";
import { Link } from "react-router-dom";
import { FaPlane } from "react-icons/fa";

import VueloCard from "../../components/VueloCards";

import productService from "../../services/productService";
import { getSafeIcon } from "../../utils/iconRegistry";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";
import "./CategoriasSection.css";

export default function CategoriasSection({ onSelectCategoria }) {
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
        setError("No se pudieron cargar los vuelos");
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };
    loadProductos();
  }, []);

  const vuelosFiltrados = useMemo(() => {
    if (!productos || productos.length === 0) return [];
    const shuffled = [...productos].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 20).map((p) => {
      const categoryName = p.category?.name || "Otros";
      const CategoryIcon = getSafeIcon(categoryName);

      // Normalizamos propiedades para que coincidan con el antiguo formato
      return {
        ...p,
        categoryName,
        CategoryIcon,
        aerolinea: p.name.split("→")[0] || "Desconocida",
        numeroVuelo: p.name.split("→")[1] || "0000",
        fechaSalida: p.departureDate || "ND",
        fechaLlegada: p.arrivalDate || "ND",
        precioTotal: p.price || 0,
        caracteristicas: p.features?.map(f => f.title || f.name) || ["Clase: Lite", "Equipaje incluido: No"]
      };
    });
  }, [productos]);

  if (loading) return <p>Cargando vuelos...</p>;
  if (error) return <p>{error}</p>;
  if (vuelosFiltrados.length === 0) return <p>No hay vuelos disponibles.</p>;

return (
  <section className="categorias-section">
    <Swiper
      modules={[Navigation, Pagination, Autoplay, A11y]}
      spaceBetween={20}
      slidesPerView={3}
      navigation
      pagination={{ clickable: true }}
      autoplay={{ delay: 3000, disableOnInteraction: false }}
      loop
    >
      {vuelosFiltrados.map((vuelo, index) => {
        const IconVuelo = vuelo.CategoryIcon || FaPlane;

        return (
         <SwiperSlide key={vuelo.id || index}>
           <Link to={`/vuelo/${vuelo.id}`} className="vuelo-link">
                <VueloCard vuelo={vuelo} compact IconComponent={vuelo.CategoryIcon} />
           </Link>
         </SwiperSlide>

        );
      })}
    </Swiper>
  </section>
);
}
