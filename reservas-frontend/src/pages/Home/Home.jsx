import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlane, FaClock, FaFilter, FaChair, FaHeart, FaRegHeart } from "react-icons/fa";

import Navbar from "../../components/Navbar/Navbar";
import BuscadorVuelos from "../../components/BuscadorVuelos/BuscadorVuelos";
import CategoriasSection from "../../components/CategoriasSection/CategoriasSection";
import Recomendaciones from "../../components/Recomendaciones/Recomendaciones";
import { useNavigate } from "react-router-dom";
import Paginacion from "../../components/Paginacion/Paginacion";
import "./Home.css";

import productService from "../../services/productService";

const splitRoute = (name = "") => {
  const clean = name.replace(/^Vuelo\s+/i, "");
  const parts = clean.split(/→|->/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { origen: parts[0], destino: parts[1] };
  }
  return { origen: clean || "N/A", destino: "N/A" };
};
export default function Home() {
  const [vuelos, setVuelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [vuelosFiltrados, setVuelosFiltrados] = useState([]);

  // 🔹 Traer vuelos desde la API real
  const fetchVuelos = async () => {
    try {
      const productos = await productService.getAllProducts();
      if (Array.isArray(productos) && productos.length > 0) {
        const vuelosData = productos.map(p => ({
          ...p,
          ...splitRoute(p.name),
          fechaSalida: p.departureDate,
          fechaLlegada: null,
          categorias: [p.category?.name || "Otros"],
          caracteristicas: p.features?.map(f => f.title || f.name) || [],
          imagenPrincipal: p.image || "/assets/default.jpg",
          precioTotal: p.price,
        }));
        setVuelos(vuelosData);
        return;
      }

      // Fallback: si la BD está vacía, mostrar vuelos de Amadeus.
      const amadeusVuelos = await productService.obtenerVuelosAPI(null, null, null, 20);
      setVuelos(amadeusVuelos || []);
    } catch (err) {
      console.error("Error al obtener vuelos desde productService:", err);
    }
  };



  // 🔹 Traer categorías desde la API
  const fetchCategorias = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorías");
      const data = await res.json();
      // el backend puede enviar { id, name, icon } u otros campos
      const mapped = (data || []).map((c) => {
        const name = c.name || c;
        const Icon = getSafeIcon(name);
        return { ...c, name, Icon };
      });
      setCategorias(mapped);
    } catch (err) {
      console.error("Error cargando categorías:", err);
    }
  };

  useEffect(() => {
    fetchVuelos();
    fetchCategorias();
  }, []);

  // Escuchar evento global para refrescar vuelos
  useEffect(() => {
    const handleVuelosActualizados = () => fetchVuelos();
    window.addEventListener("vuelosActualizados", handleVuelosActualizados);
    return () =>
      window.removeEventListener("vuelosActualizados", handleVuelosActualizados);
  }, []);

  // Paginación
  const totalPages = Math.ceil(vuelos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const vuelosPaginados = vuelos.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages > 0 ? totalPages : 1);
  }, [totalPages, currentPage]);

  const navigate = useNavigate();

  const handleSelectCategoria = (cat) => {
    // navegar a resultados con filtro por categoria
    navigate(`/resultados?categoria=${encodeURIComponent(cat)}`);
  };

  return (
    <div className="main-bg">
      <div className="header-wrapper">
        <Navbar />
      </div>

      <div className="main-content">
        <BuscadorVuelos
          categorias={categorias}
          backendVuelos={vuelos}
          onFiltrar={setVuelosFiltrados}
        />
        <CategoriasSection
          vuelos={vuelos}
          categorias={categorias}
          onSelectCategoria={handleSelectCategoria}
        />
        <Recomendaciones vuelos={vuelos} />

        <div className="vuelos-paginados-section">
          <div className="vp-header">
            <h2>Vuelos disponibles</h2>
            <button className="vp-filter-btn"><FaFilter /></button>
          </div>
          <div className="vuelos-paginados-grid">
            {vuelosPaginados.map((vuelo) => {
              const user = JSON.parse(localStorage.getItem("user"));
              const isFavorite = user?.favorites?.includes(vuelo.id);

              const toggleFavorite = async () => {
                if (!user) return alert("Debes iniciar sesión para agregar favoritos");
                try {
                  const res = await fetch(
                    `http://localhost:8080/api/favorites/toggle/${user.id}/${vuelo.id}`,
                    { method: "POST" }
                  );
                  if (!res.ok) throw new Error("Error al actualizar favoritos");
                  const updatedUser = await res.json();
                  localStorage.setItem("user", JSON.stringify(updatedUser));
                  // actualizar el estado para que se refleje sin recargar
                  setVuelos((prevVuelos) =>
                    prevVuelos.map((v) =>
                      v.id === vuelo.id ? { ...v, favorito: !v.favorito } : v
                    )
                  );
                } catch (err) {
                  console.error("Error al actualizar favorito:", err);
                }
              };

              const reservarVuelo = async () => {
                if (!user) return alert("Debes iniciar sesión para reservar un vuelo");
                try {
                  const res = await fetch("http://localhost:8080/api/bookings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: user.id,
                      productId: vuelo.id,
                      date: new Date().toISOString().split("T")[0],
                    }),
                  });
                  if (!res.ok) throw new Error("Error al reservar vuelo");
                  alert("Reserva realizada correctamente ✈️");
                } catch (err) {
                  console.error("Error al reservar:", err);
                }
              };

              return (
                <div key={vuelo.id} className="vuelo-nuevo-card">
                  <div className="vnc-img-wrapper">
                    <img
                      src={vuelo.imagenPrincipal || "/assets/default.jpg"}
                      alt={vuelo.destino || "Vuelo"}
                    />
                    <div className="vnc-price-overlay">
                      <span className="vnc-desde">DESDE</span>
                      <span className="vnc-price">${vuelo.precioTotal}</span>
                    </div>
                    <button
                      className={`vnc-fav-btn ${isFavorite ? "activo" : ""}`}
                      onClick={toggleFavorite}
                    >
                      {isFavorite ? <FaHeart color="white" /> : <FaRegHeart color="white" />}
                    </button>
                  </div>

                  <div className="vnc-info">
                    <div className="vnc-title-row">
                      <h3 className="vnc-route">{vuelo.origen} <FaPlane className="vnc-plane-icon" /> {vuelo.destino}</h3>
                      <span className="vnc-category">{vuelo.categorias?.[0] || "INTERNACIONAL"}</span>
                    </div>

                    <div className="vnc-details-row">
                      <span className="vnc-duration"><FaClock /> {vuelo.caracteristicas?.[0] || "N/A"}</span>
                      <span className="vnc-class"><FaChair /> Económica</span>
                    </div>

                    <div className="vnc-actions">
                      <button className="vnc-btn-reservar" onClick={reservarVuelo}>
                        Reservar
                      </button>
                      <Link to={`/vuelo/${vuelo.id}`} className="vnc-link-detalle">
                        <button className="vnc-btn-detalle">Ver detalle</button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {vuelos.length > 0 && (
            <Paginacion
              totalItems={vuelos.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
