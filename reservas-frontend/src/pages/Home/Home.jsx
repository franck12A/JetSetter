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
import { getUserFavorites, addFavorite as addFavApi, removeFavorite as removeFavApi } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import { getSafeIcon } from "../../utils/iconRegistry";
import { inferFlightCategories } from "../../utils/flightCategories";
import { getVueloImage } from "../../utils/images";

const splitRoute = (name = "") => {
  const clean = name.replace(/^Vuelo\s+/i, "");
  const parts = clean.split(/->|\u2192/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { origen: parts[0], destino: parts[1] };
  }
  return { origen: clean || "N/A", destino: "N/A" };
};
const resolveLocalProductId = (vuelo) => {
  const raw = vuelo?.productId ?? vuelo?.id;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};
export default function Home() {
  const [vuelos, setVuelos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [vuelosFiltrados, setVuelosFiltrados] = useState([]);

  // ðŸ”¹ Traer vuelos desde la API real
  const fetchVuelos = async () => {
    try {
      const [productos, amadeusVuelos] = await Promise.all([
        productService.getAllProducts(),
        productService.obtenerVuelosAPI(null, null, null, 20),
      ]);

      const productosLocales = (Array.isArray(productos) ? productos : [])
        .filter((p) => !p.externalId);

      const vuelosBd = productosLocales.map((p) => ({
        ...p,
        productId: p.id,
        ...splitRoute(p.name),
        fechaSalida: p.departureDate,
        fechaLlegada: null,
        categorias: [p.category?.name || "Otros"],
        caracteristicas: p.features?.map((f) => f.title || f.name) || [],
        imagenPrincipal: p.image || p.imagesBase64?.[0] || "/assets/default.jpg",
        precioTotal: p.price,
      }));

      const vuelosAmadeus = Array.isArray(amadeusVuelos) ? amadeusVuelos : [];
      const merged = [...vuelosBd, ...vuelosAmadeus].map((vuelo) => ({
        ...vuelo,
        categorias: inferFlightCategories(vuelo),
      }));
      const dedup = [];
      const seenDestinos = new Set();

      for (const vuelo of merged) {
        const destinoKey = (vuelo.destino || "N/A").toUpperCase();
        if (seenDestinos.has(destinoKey)) continue;
        seenDestinos.add(destinoKey);
        dedup.push(vuelo);
      }

      setVuelos(dedup);
    } catch (err) {
      console.error("Error al obtener vuelos desde productService:", err);
    }
  };



  // ðŸ”¹ Traer categorÃ­as desde la API
  const fetchCategorias = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/categories");
      if (!res.ok) throw new Error("Error al cargar categorÃ­as");
      const data = await res.json();
      // el backend puede enviar { id, name, icon } u otros campos
      const mapped = (data || []).map((c) => {
        const name = c.name || c;
        const iconToken = c?.icon || c?.iconName || c?.Icon || name;
        const Icon = getSafeIcon(iconToken);
        return { ...c, name, Icon };
      });
      setCategorias(mapped);
    } catch (err) {
      console.error("Error cargando categorÃ­as:", err);
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

  // PaginaciÃ³n
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
              const token = localStorage.getItem("token");
              const localProductId = resolveLocalProductId(vuelo);
              const isFavorite = localProductId ? user?.favorites?.includes(localProductId) : false;

              const toggleFavorite = async () => {
                if (!user || !token) return alert("Debes iniciar sesión para agregar favoritos");
                if (!localProductId) return alert("Este vuelo de Amadeus no está guardado en la BD.");
                try {
                  if (isFavorite) {
                    await removeFavApi(localProductId);
                  } else {
                    await addFavApi(localProductId);
                  }

                  // refrescar favoritos desde backend y actualizar localStorage
                  try {
                    const favs = await getUserFavorites();
                    const favIds = (favs || []).map((p) => p.id);
                    const stored = JSON.parse(localStorage.getItem("user") || "{}");
                    stored.favorites = favIds;
                    localStorage.setItem("user", JSON.stringify(stored));
                  } catch (refreshErr) {
                    console.error("No se pudieron actualizar favoritos localmente:", refreshErr);
                  }

                  // actualizar estado de vuelos para re-render
                  setVuelos((prevVuelos) =>
                    prevVuelos.map((v) =>
                      v.id === vuelo.id ? { ...v, favorito: !v.favorito } : v
                    )
                  );
                } catch (err) {
                  console.error("Error al actualizar favorito:", err);
                  alert("Tu sesión expiró o no es válida. Iniciá sesión nuevamente.");
                }
              };

              const reservarVuelo = async () => {
                if (!user || !token) return alert("Debes iniciar sesión para reservar un vuelo");
                if (!localProductId) return alert("Este vuelo de Amadeus no está guardado en la BD.");
                try {
                  await createBooking({
                    userId: user.id,
                    productId: localProductId,
                    dateStr: new Date().toISOString(),
                    passengers: 1,
                  });
                  alert("Reserva realizada correctamente ✈️");
                } catch (err) {
                  console.error("Error al reservar:", err);
                }
              };

              return (
                <div key={vuelo.id} className="vuelo-nuevo-card">
                  <div className="vnc-img-wrapper">
                    <img
                      src={getVueloImage(vuelo)}
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
                      <Link
                        to={`/vuelo/${localProductId || vuelo.id}`}
                        state={{ vuelo: { ...vuelo, productId: localProductId || vuelo.productId || vuelo.id } }}
                        className="vnc-link-detalle"
                      >
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

