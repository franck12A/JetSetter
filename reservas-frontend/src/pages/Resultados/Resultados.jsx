import React, { useEffect, useMemo, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { FaPlane, FaClock, FaCalendarAlt, FaHeart, FaRegHeart } from "react-icons/fa";
import Paginacion from "../../components/Paginacion/Paginacion";
import productService from "../../services/productService";
import { getVueloImage } from "../../utils/images";
import "./Resultados.css";

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const toISODate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const splitRoute = (name = "") => {
  const clean = String(name || "").replace(/^Vuelo\s+/i, "").trim();
  const parts = clean.split(/->|\u2192/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) return { origen: parts[0], destino: parts[1] };
  return { origen: clean || "N/A", destino: "N/A" };
};

const getDuration = (vuelo) => {
  if (vuelo.duration) return vuelo.duration;
  const featureDuration = (vuelo.caracteristicas || []).find((f) => /duraci[oó]n/i.test(String(f)));
  return featureDuration || "N/D";
};

const normalizeVuelo = (vuelo = {}) => {
  const route = splitRoute(vuelo.name);
  const rawProductId = vuelo.productId ?? vuelo.id;
  const parsedProductId = Number(rawProductId);

  return {
    ...vuelo,
    uid: `${vuelo.externalId || "local"}-${vuelo.id || vuelo.productId || vuelo.name || Math.random()}`,
    localProductId: Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null,
    origen: vuelo.origen || vuelo.origin || route.origen,
    destino: vuelo.destino || vuelo.destination || route.destino,
    fechaISO: toISODate(vuelo.fechaSalida || vuelo.departureDate || vuelo.date),
    fechaRaw: vuelo.fechaSalida || vuelo.departureDate || vuelo.date || null,
    precio: Number(vuelo.precioTotal ?? vuelo.price ?? 0),
    categoria:
      vuelo.category?.name ||
      vuelo.category ||
      (Array.isArray(vuelo.categorias) ? vuelo.categorias[0] : "") ||
      "Sin categoria",
    duracion: getDuration(vuelo),
  };
};

const formatFecha = (value) => {
  if (!value) return "Fecha no disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStoredFavorites = () => {
  try {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  } catch {
    return [];
  }
};

export default function Resultados() {
  const location = useLocation();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const filtroOrigen = queryParams.get("origen") || "";
  const filtroDestino = queryParams.get("destino") || "";
  const filtroFecha = queryParams.get("fecha") || "";
  const filtroCategoria = queryParams.get("categoria") || "";

  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(getStoredFavorites());
  const itemsPerPage = 8;

  useEffect(() => {
    const fetchVuelos = async () => {
      setLoading(true);
      try {
        const [localResult, apiResult] = await Promise.allSettled([
          productService.getAllProducts(),
          productService.obtenerVuelosAPI(null, null, null, 40),
        ]);

        const localVuelos = localResult.status === "fulfilled" ? localResult.value || [] : [];
        const apiVuelos = apiResult.status === "fulfilled" ? apiResult.value || [] : [];

        const all = [...localVuelos, ...apiVuelos].map(normalizeVuelo);

        const unique = [];
        const seen = new Set();
        all.forEach((vuelo) => {
          const dedupKey = [
            normalizeText(vuelo.origen),
            normalizeText(vuelo.destino),
            vuelo.fechaISO,
            vuelo.precio,
            normalizeText(vuelo.aerolinea || ""),
          ].join("|");

          if (!seen.has(dedupKey)) {
            seen.add(dedupKey);
            unique.push(vuelo);
          }
        });

        setVuelos(unique);
      } catch (err) {
        console.error("Error cargando vuelos:", err);
        setVuelos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVuelos();
  }, []);

  const resultadosFiltrados = useMemo(() => {
    return vuelos
      .filter((v) => {
        const coincideOrigen = !filtroOrigen || normalizeText(v.origen) === normalizeText(filtroOrigen);
        const coincideDestino = !filtroDestino || normalizeText(v.destino) === normalizeText(filtroDestino);
        const coincideFecha = !filtroFecha || v.fechaISO === filtroFecha;
        const coincideCategoria = !filtroCategoria || normalizeText(v.categoria) === normalizeText(filtroCategoria);
        return coincideOrigen && coincideDestino && coincideFecha && coincideCategoria;
      })
      .sort((a, b) => {
        const dateA = a.fechaISO || "9999-12-31";
        const dateB = b.fechaISO || "9999-12-31";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.precio - b.precio;
      });
  }, [vuelos, filtroOrigen, filtroDestino, filtroFecha, filtroCategoria]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroOrigen, filtroDestino, filtroFecha, filtroCategoria]);

  const totalPages = Math.max(1, Math.ceil(resultadosFiltrados.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const vuelosPaginados = resultadosFiltrados.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const toggleFavorite = (vuelo) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      alert("Debes iniciar sesion para agregar favoritos.");
      window.location.href = "/login";
      return;
    }

    const exists = favorites.some((f) => f.uid === vuelo.uid && f.userId === user.id);
    const updated = exists
      ? favorites.filter((f) => !(f.uid === vuelo.uid && f.userId === user.id))
      : [...favorites, { uid: vuelo.uid, userId: user.id }];

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const reservarVuelo = async (vuelo) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      alert("Debes iniciar sesion para reservar un vuelo.");
      window.location.href = "/login";
      return;
    }

    if (!vuelo.localProductId) {
      alert("Este vuelo no esta disponible para reserva directa desde resultados.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Debes iniciar sesion para reservar un vuelo.");
      window.location.href = "/login";
      return;
    }

    try {
      const res = await fetch("http://localhost:8080/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          productId: vuelo.localProductId,
          dateStr: vuelo.fechaISO || new Date().toISOString().slice(0, 10),
          passengers: 1,
        }),
      });

      if (!res.ok) throw new Error("Error al crear la reserva");
      alert(`Reserva creada para: ${vuelo.name || `${vuelo.origen} -> ${vuelo.destino}`}`);
    } catch (err) {
      console.error("Error reservando vuelo:", err);
      alert("Hubo un error al reservar el vuelo.");
    }
  };

  const filtrosActivos = [
    filtroOrigen ? `Origen: ${filtroOrigen}` : null,
    filtroDestino ? `Destino: ${filtroDestino}` : null,
    filtroFecha ? `Fecha: ${filtroFecha}` : null,
    filtroCategoria ? `Categoria: ${filtroCategoria}` : null,
  ].filter(Boolean);

  return (
    <div className="main-bg resultados-page">
      <div className="main-content resultados-content">
        <h1 className="resultados-title">Resultados de busqueda</h1>
        <p className="resultados-subtitle">
          Mostrando {resultadosFiltrados.length} vuelo(s) de {vuelos.length} disponibles.
        </p>

        {filtrosActivos.length > 0 && (
          <div className="resultados-filtros">
            {filtrosActivos.map((filtro) => (
              <span key={filtro} className="resultados-chip">
                {filtro}
              </span>
            ))}
          </div>
        )}

        {loading && <p className="resultados-empty">Cargando vuelos...</p>}

        {!loading && vuelosPaginados.length === 0 && (
          <p className="resultados-empty">No se encontraron vuelos con esos filtros.</p>
        )}

        <div className="resultados-grid">
          {vuelosPaginados.map((vuelo) => {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            const isFavorite = favorites.some((f) => f.uid === vuelo.uid && f.userId === user?.id);

            return (
              <article key={vuelo.uid} className="resultados-card">
                <img
                  src={getVueloImage(vuelo)}
                  alt={vuelo.name || `${vuelo.origen} ${vuelo.destino}`}
                  className="resultados-img"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "/assets/avionsito.png";
                  }}
                />

                <div className="resultados-info">
                  <h3>{vuelo.origen} {"->"} {vuelo.destino}</h3>

                  <p>
                    <FaPlane /> {vuelo.aerolinea || "Aerolinea no disponible"}
                  </p>
                  <p>
                    <FaCalendarAlt /> {formatFecha(vuelo.fechaRaw || vuelo.fechaISO)}
                  </p>
                  <p>
                    <FaClock /> {vuelo.duracion}
                  </p>

                  <span className="resultados-category">{vuelo.categoria}</span>
                </div>

                <div className="resultados-side">
                  <strong className="resultados-price">${vuelo.precio}</strong>

                  <button
                    className={`btn-fav ${isFavorite ? "activo" : ""}`}
                    onClick={() => toggleFavorite(vuelo)}
                  >
                    {isFavorite ? <FaHeart /> : <FaRegHeart />} {isFavorite ? "Favorito" : "Agregar"}
                  </button>

                  <button className="btn-reservar" onClick={() => reservarVuelo(vuelo)}>
                    Reservar
                  </button>

                  <Link to={`/vuelo/${vuelo.id || vuelo.productId}`} state={{ vuelo }}>
                    <button className="btn-detalle">Ver detalle</button>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {!loading && resultadosFiltrados.length > 0 && (
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
