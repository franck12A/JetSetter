// src/pages/Resultados.jsx
import React, { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaPlane, FaClock } from "react-icons/fa";
import Paginacion from "../../components/Paginacion/Paginacion";
import { getVueloImage } from "../../utils/images";
import "./Resultados.css";

const splitRoute = (name = "") => {
  const clean = name.replace(/^Vuelo\s+/i, "");
  const parts = clean.split(/→|->/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { origen: parts[0], destino: parts[1] };
  return { origen: clean || "N/A", destino: "N/A" };
};

export default function Resultados() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);

  // 🔹 Filtros desde query params
  const filtroOrigen = queryParams.get("origen") || "";
  const filtroDestino = queryParams.get("destino") || "";
  const filtroFecha = queryParams.get("fecha") || "";
  const filtroCategoria = queryParams.get("categoria") || "";

  const [vuelos, setVuelos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 🔹 Traer vuelos (backend + mock)
  useEffect(() => {
    const fetchVuelos = async () => {
      try {
        const resBackend = await fetch("http://localhost:8080/api/products");
        const backendDataRaw = await resBackend.json();
        const backendData = (backendDataRaw || []).map((p) => ({
          ...p,
          ...splitRoute(p.name),
          date: p.departureDate,
          price: p.price,
          category: p.category,
        }));

        const resMock = await fetch("/mockVuelos.json");
        const mockData = await resMock.json();

        // Combinar y eliminar duplicados por ID
        const todos = [...backendData, ...mockData];
        const unicos = [];
        const ids = new Set();
        for (const vuelo of todos) {
          if (!ids.has(vuelo.id)) {
            ids.add(vuelo.id);
            unicos.push(vuelo);
          }
        }

        setVuelos(unicos);
      } catch (err) {
        console.error("Error cargando vuelos:", err);
      }
    };

    fetchVuelos();
  }, []);

  // 🔹 Filtrar vuelos
  const resultadosFiltrados = vuelos.filter((v) => {
const normalize = (str) =>
  (str || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // saca tildes

const coincideOrigen =
  filtroOrigen.trim() === "" ||
  normalize(v.origen || v.origin).includes(normalize(filtroOrigen));

const coincideDestino =
  filtroDestino.trim() === "" ||
  normalize(v.destino || v.destination).includes(normalize(filtroDestino));
    const coincideCategoria =
      filtroCategoria === "" ||
      (v.category?.name || v.category || "").toLowerCase() ===
        filtroCategoria.toLowerCase();
    const formatearFecha = (f) => {
      if (!f) return "";
      const d = new Date(f);
      if (isNaN(d)) return "";
      return d.toISOString().split("T")[0]; // devuelve YYYY-MM-DD
    };

    const coincideFecha =
      filtroFecha.trim() === "" ||
      formatearFecha(v.date) === filtroFecha;


    return coincideOrigen && coincideDestino && coincideCategoria && coincideFecha;
  });

  // 🔹 Paginación
  const totalPages = Math.ceil(resultadosFiltrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const vuelosPaginados = resultadosFiltrados.slice(startIndex, endIndex);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages > 0 ? totalPages : 1);
  }, [totalPages, currentPage]);

  // 🔹 Botón de favorito
  const toggleFavorite = (vuelo) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Debes iniciar sesión para agregar favoritos.");
      window.location.href = "/login";
      return;
    }

    const localFavs = JSON.parse(localStorage.getItem("favorites")) || [];
    const existe = localFavs.some(f => f.id === vuelo.id && f.userId === user.id);

    if (existe) {
      const updated = localFavs.filter(f => !(f.id === vuelo.id && f.userId === user.id));
      localStorage.setItem("favorites", JSON.stringify(updated));
    } else {
      localStorage.setItem("favorites", JSON.stringify([...localFavs, { ...vuelo, userId: user.id }]));
    }

    setVuelos(prev => prev.map(v => v.id === vuelo.id ? { ...v } : v));
  };

  // 🔹 Botón de reservar
  const reservarVuelo = async (vuelo) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Debes iniciar sesión para reservar un vuelo.");
      window.location.href = "/login";
      return;
    }

    const isLocalVuelo = !vuelo.backendId;

    if (isLocalVuelo) {
      const reservas = JSON.parse(localStorage.getItem("reservas")) || [];
      reservas.push({
        ...vuelo,
        userId: user.id,
        dateStr: new Date().toISOString().split("T")[0],
        passengers: 1,
      });
      localStorage.setItem("reservas", JSON.stringify(reservas));
      alert(`✅ Reserva guardada localmente para: ${vuelo.name}`);
    } else {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Debes iniciar sesión para reservar un vuelo.");
        window.location.href = "/login";
        return;
      }

      try {
        const res = await fetch("http://localhost:8080/api/bookings/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            productId: vuelo.id,
            dateStr: new Date().toISOString().split("T")[0],
            passengers: 1,
          }),
        });

        if (!res.ok) throw new Error("Error al crear la reserva");
        alert(`✅ Reserva creada para: ${vuelo.name}`);
      } catch (err) {
        console.error("Error reservando vuelo:", err);
        alert("Hubo un error al reservar el vuelo.");
      }
    }
  };

  return (
    <div className="main-bg resultados-page">
      <div className="main-content">
        <h1>Resultados de búsqueda</h1>
        <p>
          Mostrando {resultadosFiltrados.length} vuelo(s) filtrados de {vuelos.length}
        </p>

        {vuelosPaginados.length === 0 && (
          <p>No se encontraron vuelos con esos filtros.</p>
        )}

        <div className="vuelos-paginados-grid">
          {vuelosPaginados.map((vuelo) => {
            const user = JSON.parse(localStorage.getItem("user"));
            const isFavorite = user?.favorites?.includes(vuelo.id) ||
              JSON.parse(localStorage.getItem("favorites") || "[]").some(f => f.id === vuelo.id && f.userId === user?.id);

            return (
              <div key={vuelo.id} className="vuelo-paginado-card">
                  <img src={getVueloImage(vuelo)} alt={vuelo.name} />
                <div className="vuelo-paginado-info">
                  <h3>{vuelo.name}</h3>
                  <p><FaPlane /> {vuelo.origen || vuelo.origin} → {vuelo.destino || vuelo.destination}</p>
                  <p><FaClock /> Duración: {vuelo.duration || "N/A"}</p>
                  <p>{vuelo.category?.name || vuelo.category || "—"}</p>
                  <p>${vuelo.price}</p>

                  <div className="botones-vuelo">
                    <button
                      className={`btn-fav ${isFavorite ? "activo" : ""}`}
                      onClick={() => toggleFavorite(vuelo)}
                    >
                      {isFavorite ? "❤️ Favorito" : "🤍 Agregar"}
                    </button>
                    <button className="btn-reservar" onClick={() => reservarVuelo(vuelo)}>
                      <span style={{color: 'red', marginRight: '4px'}}>❤️</span>
                      <span style={{color: 'black'}}>Reservar</span>
                    </button>
                  </div>

                 <Link to={`/vuelo/${vuelo.id}`} state={{ vuelo }}>
                   <button className="btn-detalle">Ver detalle</button>
                 </Link>

                </div>
              </div>
            );
          })}
        </div>

        {resultadosFiltrados.length > 0 && (
          <Paginacion
            totalItems={resultadosFiltrados.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        )}
      </div>
    </div>
  );
}
