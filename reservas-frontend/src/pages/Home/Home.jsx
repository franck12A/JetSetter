import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPlane, FaClock } from "react-icons/fa";

import Navbar from "../../components/Navbar/Navbar";
import BuscadorVuelos from "../../components/BuscadorVuelos/BuscadorVuelos";
import CategoriasSection from "../../components/CategoriasSection/CategoriasSection";
import Recomendaciones from "../../components/Recomendaciones/Recomendaciones";
import Paginacion from "../../components/Paginacion/Paginacion";
import "./Home.css";

import productService from "../../services/productService";
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
    // Mapear los campos para que coincidan con la UI
    const vuelosData = productos.map(p => ({
      ...p,
      origen: p.origin,
      destino: p.destination,
      fechaSalida: p.departureDate,
      fechaLlegada: p.arrivalDate,
      categorias: [p.category?.name || "Otros"],
      caracteristicas: p.features?.map(f => f.title || f.name) || [],
      imagenPrincipal: p.imageUrl || "/assets/default.jpg",
      precioTotal: p.price,
    }));
    setVuelos(vuelosData);
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
      setCategorias(data || []);
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

  return (
    <div className="main-bg">
      <div className="header-wrapper">
        <Navbar />
        <BuscadorVuelos
          categorias={categorias}
          vuelosRaw={vuelos}
          onFiltrar={setVuelosFiltrados}
        />
      </div>

      <div className="main-content">
        <CategoriasSection vuelos={vuelos} categorias={categorias} />
        <Recomendaciones vuelos={vuelos} />

        <div className="vuelos-paginados-section">
          <h2>Vuelos disponibles</h2>
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
                <div key={vuelo.id} className="vuelo-paginado-card">
                  <img
                    src={vuelo.imagenPrincipal || "/assets/default.jpg"}
                    alt={vuelo.destino || "Vuelo"}
                  />
                  <div className="vuelo-paginado-info">
                    <h3>{vuelo.origen} → {vuelo.destino}</h3>
                    <p>
                      <FaPlane /> {vuelo.origen} → {vuelo.destino}
                    </p>
                    <p>
                      <FaClock /> Duración: {vuelo.caracteristicas?.[0] || "N/A"}
                    </p>
                    <p>{vuelo.categorias?.join(", ")}</p>
                    <p>${vuelo.precioTotal}</p>

                    <div className="botones-vuelo">
                      <button
                        className={`btn-fav ${isFavorite ? "activo" : ""}`}
                        onClick={toggleFavorite}
                      >
                        {isFavorite ? "❤️ Favorito" : "🤍 Agregar"}
                      </button>
                      <button className="btn-reservar" onClick={reservarVuelo}>
                        Reservar
                      </button>
                    </div>

                    <Link to={`/vuelo/${vuelo.id}`}>
                      <button className="btn-detalle">Ver detalle</button>
                    </Link>
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
