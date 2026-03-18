import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { FaPlane, FaClock, FaCalendarAlt, FaHeart, FaRegHeart, FaTimes, FaFilter } from "react-icons/fa";
import Paginacion from "../../components/Paginacion/Paginacion";
import productService from "../../services/productService";
import { addFavorite as addFavApi, removeFavorite as removeFavApi, getUserFavorites } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import { getVueloImage } from "../../utils/images";
import { inferFlightCategories, hasCategoryMatch } from "../../utils/flightCategories";
import { getSafeIcon } from "../../utils/iconRegistry";
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

const parseSelectedCategories = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const CATEGORY_PRIORITY = [
  "Internacional",
  "Nacional",
  "Playa",
  "Montana",
  "Montaña",
  "Ciudad",
  "Aventura",
  "Lujo",
  "Familiar",
  "Naturaleza",
];

const getDuration = (vuelo) => {
  if (vuelo.duration) return vuelo.duration;
  const featureDuration = (vuelo.caracteristicas || []).find((f) => /duraci[oó]n/i.test(String(f)));
  return featureDuration || "N/D";
};

const normalizeVuelo = (vuelo = {}) => {
  const route = splitRoute(vuelo.name);
  const rawProductId = vuelo.productId ?? vuelo.id;
  const parsedProductId = Number(rawProductId);
  const origen = vuelo.origen || vuelo.origin || route.origen;
  const destino = vuelo.destino || vuelo.destination || route.destino;
  const routeLabel = [origen, destino].filter(Boolean).join(" -> ");
  const nombre = String(vuelo.name || vuelo.nombre || "").trim();

  return {
    ...vuelo,
    uid: `${vuelo.externalId || "local"}-${vuelo.id || vuelo.productId || vuelo.name || Math.random()}`,
    localProductId: Number.isInteger(parsedProductId) && parsedProductId > 0 ? parsedProductId : null,
    origen,
    destino,
    displayName: nombre || routeLabel || "Vuelo sin nombre",
    categorias: inferFlightCategories({ ...vuelo, origen, destino }),
    fechaISO: toISODate(vuelo.fechaSalida || vuelo.departureDate || vuelo.date),
    fechaRaw: vuelo.fechaSalida || vuelo.departureDate || vuelo.date || null,
    precio: Number(vuelo.precioTotal ?? vuelo.price ?? 0),
    categoria: inferFlightCategories({ ...vuelo, origen, destino })[0] || "Sin categoria",
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

const NEARBY_DAYS = 20;

const toDateOnly = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const diffDays = (a, b) => Math.round(Math.abs(a.getTime() - b.getTime()) / 86400000);

const distanceToRange = (isoDate, range) => {
  if (!isoDate || !range) return Number.POSITIVE_INFINITY;
  const date = toDateOnly(isoDate);
  const start = toDateOnly(range.start);
  const end = toDateOnly(range.end);
  if (!date || !start || !end) return Number.POSITIVE_INFINITY;
  if (date >= start && date <= end) return 0;
  if (date < start) return diffDays(start, date);
  return diffDays(date, end);
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
  const navigate = useNavigate();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const filtroOrigen = queryParams.get("origen") || "";
  const filtroDestino = queryParams.get("destino") || "";
  const filtroFecha = queryParams.get("fecha") || "";
  const filtroFechaSalida = queryParams.get("fechaSalida") || queryParams.get("fechaInicio") || "";
  const filtroFechaRegreso = queryParams.get("fechaRegreso") || queryParams.get("fechaFin") || "";
  const filtroCategoria = queryParams.get("categoria") || "";

  const [vuelos, setVuelos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(getStoredFavorites());
  const [selectedCategories, setSelectedCategories] = useState(() => parseSelectedCategories(filtroCategoria));
  const [filtersOpen, setFiltersOpen] = useState(true);
  const itemsPerPage = 8;

  const dateRange = useMemo(() => {
    const start = filtroFechaSalida || filtroFecha || "";
    const end = filtroFechaRegreso || filtroFecha || "";
    if (!start && !end) return null;
    return { start: start || end, end: end || start };
  }, [filtroFechaSalida, filtroFechaRegreso, filtroFecha]);

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
        const seenDestinos = new Set();
        all.forEach((vuelo) => {
          const dedupKey = normalizeText(vuelo.destino || "N/A");
          if (!seenDestinos.has(dedupKey)) {
            seenDestinos.add(dedupKey);
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


  useEffect(() => {
    setSelectedCategories(parseSelectedCategories(filtroCategoria));
  }, [filtroCategoria]);

  const baseSinFecha = useMemo(() => {
    return vuelos.filter((v) => {
      const coincideOrigen = !filtroOrigen || normalizeText(v.origen) === normalizeText(filtroOrigen);
      const coincideDestino = !filtroDestino || normalizeText(v.destino) === normalizeText(filtroDestino);
      return coincideOrigen && coincideDestino;
    });
  }, [vuelos, filtroOrigen, filtroDestino]);

  const baseFiltrados = useMemo(() => {
    return baseSinFecha.filter((v) => {
      const coincideFecha =
        !dateRange ||
        (v.fechaISO && v.fechaISO >= dateRange.start && v.fechaISO <= dateRange.end);
      return coincideFecha;
    });
  }, [baseSinFecha, dateRange]);

  const resultadosFiltrados = useMemo(() => {
    return baseFiltrados
      .filter((v) => hasCategoryMatch(v.categorias, selectedCategories))
      .sort((a, b) => {
        const dateA = a.fechaISO || "9999-12-31";
        const dateB = b.fechaISO || "9999-12-31";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.precio - b.precio;
      });
  }, [baseFiltrados, selectedCategories]);

  const resultadosCercanos = useMemo(() => {
    if (!dateRange) return [];
    return baseSinFecha
      .filter((v) => hasCategoryMatch(v.categorias, selectedCategories))
      .map((v) => ({ vuelo: v, distancia: distanceToRange(v.fechaISO, dateRange) }))
      .filter((item) => Number.isFinite(item.distancia) && item.distancia > 0 && item.distancia <= NEARBY_DAYS)
      .sort((a, b) => {
        if (a.distancia !== b.distancia) return a.distancia - b.distancia;
        const dateA = a.vuelo.fechaISO || "9999-12-31";
        const dateB = b.vuelo.fechaISO || "9999-12-31";
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return a.vuelo.precio - b.vuelo.precio;
      });
  }, [baseSinFecha, dateRange, selectedCategories]);

  const showNearby = Boolean(dateRange) && resultadosFiltrados.length === 0 && resultadosCercanos.length > 0;
  const listaMostrada = showNearby ? resultadosCercanos.map((item) => item.vuelo) : resultadosFiltrados;

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroOrigen, filtroDestino, dateRange, selectedCategories]);

  useEffect(() => {
    if (window.innerWidth <= 900) {
      setFiltersOpen(false);
    }
  }, []);

  const totalPages = Math.max(1, Math.ceil(listaMostrada.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const vuelosPaginados = listaMostrada.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    (showNearby ? listaMostrada : baseFiltrados).forEach((vuelo) => {
      (vuelo.categorias || []).forEach((cat) => {
        if (!cat) return;
        counts.set(cat, (counts.get(cat) || 0) + 1);
      });
    });
    return counts;
  }, [baseFiltrados, showNearby, listaMostrada]);

  const categoryOptions = useMemo(() => {
    const items = Array.from(categoryCounts.entries()).map(([name, count]) => ({ name, count }));
    const known = new Set(items.map((item) => normalizeText(item.name)));
    selectedCategories.forEach((cat) => {
      if (!known.has(normalizeText(cat))) {
        items.push({ name: cat, count: 0 });
      }
    });
    return items.sort((a, b) => {
      const idxA = CATEGORY_PRIORITY.indexOf(a.name);
      const idxB = CATEGORY_PRIORITY.indexOf(b.name);
      if (idxA !== -1 || idxB !== -1) {
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      }
      return a.name.localeCompare(b.name);
    });
  }, [categoryCounts, selectedCategories]);

  const updateSearchParams = (mutator) => {
    const params = new URLSearchParams(location.search);
    mutator(params);
    const nextSearch = params.toString();
    navigate(
      { pathname: location.pathname, search: nextSearch ? `?${nextSearch}` : "" },
      { replace: true }
    );
  };

  const updateCategoryInQuery = (nextCategories) => {
    updateSearchParams((params) => {
      if (nextCategories.length > 0) {
        params.set("categoria", nextCategories.join(","));
      } else {
        params.delete("categoria");
      }
    });
  };

  const toggleCategory = (category) => {
    setSelectedCategories((prev) => {
      const exists = prev.some((c) => normalizeText(c) === normalizeText(category));
      const next = exists
        ? prev.filter((c) => normalizeText(c) !== normalizeText(category))
        : [...prev, category];
      updateCategoryInQuery(next);
      return next;
    });
  };

  const clearCategories = () => {
    setSelectedCategories([]);
    updateCategoryInQuery([]);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    updateSearchParams((params) => {
      params.delete("origen");
      params.delete("destino");
      params.delete("fecha");
      params.delete("fechaInicio");
      params.delete("fechaFin");
      params.delete("fechaSalida");
      params.delete("fechaRegreso");
      params.delete("categoria");
    });
  };

  const removeQueryParam = (key) => {
    updateSearchParams((params) => params.delete(key));
  };

  const removeCategoryFilter = (category) => {
    setSelectedCategories((prev) => {
      const next = prev.filter((c) => normalizeText(c) !== normalizeText(category));
      updateCategoryInQuery(next);
      return next;
    });
  };

  const hasSalida = Boolean(filtroFechaSalida || filtroFecha);
  const hasRegreso = Boolean(filtroFechaRegreso || filtroFecha);

  const toggleFavorite = async (vuelo) => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user) {
      alert("Debes iniciar sesion para agregar favoritos.");
      window.location.href = "/login";
      return;
    }

    if (!vuelo.localProductId) {
      alert("Este vuelo no esta guardado en la BD para favoritos.");
      return;
    }

    const exists = favorites.some((f) => f.uid === vuelo.uid && f.userId === user.id);
    try {
      if (exists) {
        await removeFavApi(vuelo.localProductId);
      } else {
        await addFavApi(vuelo.localProductId);
      }

      const updated = exists
        ? favorites.filter((f) => !(f.uid === vuelo.uid && f.userId === user.id))
        : [...favorites, { uid: vuelo.uid, userId: user.id }];

      setFavorites(updated);
      localStorage.setItem("favorites", JSON.stringify(updated));

      try {
        const favs = await getUserFavorites();
        const favIds = (favs || []).map((p) => p.id);
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        stored.favorites = favIds;
        localStorage.setItem("user", JSON.stringify(stored));
      } catch (refreshErr) {
        console.error("No se pudieron actualizar favoritos localmente:", refreshErr);
      }
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
      alert("No se pudo actualizar el favorito.");
    }
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

    try {
      await createBooking({
        productId: vuelo.localProductId,
        dateStr: vuelo.fechaISO || new Date().toISOString().slice(0, 10),
        passengers: 1,
      });
      alert(`Reserva creada para: ${vuelo.name || `${vuelo.origen} -> ${vuelo.destino}`}`);
    } catch (err) {
      console.error("Error reservando vuelo:", err);
      alert(err?.message || "Hubo un error al reservar el vuelo.");
    }
  };

  const filtrosActivos = [
    filtroOrigen
      ? { key: "origen", label: `Origen: ${filtroOrigen}`, onRemove: () => removeQueryParam("origen") }
      : null,
    filtroDestino
      ? { key: "destino", label: `Destino: ${filtroDestino}`, onRemove: () => removeQueryParam("destino") }
      : null,
    dateRange
      ? {
          key: "fecha",
          label: hasSalida && hasRegreso && dateRange.start !== dateRange.end
            ? `Salida: ${formatFecha(dateRange.start)} · Regreso: ${formatFecha(dateRange.end)}`
            : hasSalida
              ? `Salida: ${formatFecha(dateRange.start)}`
              : `Regreso: ${formatFecha(dateRange.end)}`,
          onRemove: () =>
            updateSearchParams((params) => {
              params.delete("fecha");
              params.delete("fechaInicio");
              params.delete("fechaFin");
              params.delete("fechaSalida");
              params.delete("fechaRegreso");
            }),
        }
      : null,
    ...selectedCategories.map((cat) => ({
      key: `cat-${cat}`,
      label: `Categoria: ${cat}`,
      onRemove: () => removeCategoryFilter(cat),
    })),
  ].filter(Boolean);

  const hasActiveFilters = filtrosActivos.length > 0;

  return (
    <div className="main-bg resultados-page">
      <div className="main-content resultados-content">
        <div className="resultados-header">
          <div>
            <h1 className="resultados-title">Resultados de búsqueda</h1>
            <p className="resultados-subtitle">
              {showNearby ? (
                <>
                  No encontramos vuelos exactos para esas fechas. Mostrando <strong>{listaMostrada.length}</strong> opciones cercanas.
                </>
              ) : (
                <>
                  Mostrando <strong>{listaMostrada.length}</strong> de <strong>{vuelos.length}</strong> resultados.
                </>
              )}
            </p>
          </div>
          {hasActiveFilters && (
            <button className="resultados-clear-btn" onClick={clearAllFilters}>
              Limpiar filtros
            </button>
          )}
          <button
            className={`resultados-filter-toggle ${filtersOpen ? "is-open" : ""}`}
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <FaFilter /> {filtersOpen ? "Ocultar filtros" : "Filtrar"}
          </button>
        </div>

        <div className={`resultados-layout ${filtersOpen ? "" : "filters-collapsed"}`}>
          <aside className={`resultados-filters-panel ${filtersOpen ? "is-open" : "is-closed"}`}>
            <div className="resultados-filter-head">
              <h2>Filtrar</h2>
              <span>{listaMostrada.length}/{vuelos.length}</span>
            </div>

            <div className="resultados-filter-section">
              <p className="resultados-filter-title">Categorias</p>
              <div className="resultados-category-list">
                <button
                  type="button"
                  className={`resultados-category-pill ${selectedCategories.length === 0 ? "active" : ""}`}
                  onClick={clearCategories}
                >
                  <span className="pill-left">
                    <FaPlane />
                    <span className="pill-label">Todas</span>
                  </span>
                  <span className="pill-count">{baseFiltrados.length}</span>
                </button>
                {categoryOptions.map((item) => {
                  const active = selectedCategories.some((c) => normalizeText(c) === normalizeText(item.name));
                  const Icon = getSafeIcon(item.name);
                  return (
                    <button
                      type="button"
                      key={item.name}
                      className={`resultados-category-pill ${active ? "active" : ""}`}
                      onClick={() => toggleCategory(item.name)}
                    >
                      <span className="pill-left">
                        {Icon ? <Icon /> : null}
                        <span className="pill-label">{item.name}</span>
                      </span>
                      <span className="pill-count">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {filtrosActivos.length > 0 && (
              <div className="resultados-filter-section">
                <p className="resultados-filter-title">Filtros activos</p>
                <div className="resultados-filtros">
                  {filtrosActivos.map((filtro) => (
                    <span key={filtro.key} className="resultados-chip">
                      <span>{filtro.label}</span>
                      <button
                        type="button"
                        className="resultados-chip-remove"
                        onClick={filtro.onRemove}
                        aria-label={`Quitar ${filtro.label}`}
                      >
                        <FaTimes />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="resultados-list-panel">
            {loading && <p className="resultados-empty">Cargando vuelos...</p>}

            {!loading && vuelosPaginados.length === 0 && (
              <p className="resultados-empty">
                {dateRange ? "No se encontraron vuelos para esas fechas." : "No se encontraron vuelos con esos filtros."}
              </p>
            )}

            {!loading && showNearby && (
              <div className="resultados-alert">
                <strong>No encontramos vuelos exactos para tus fechas.</strong>
                <span>Te mostramos opciones cercanas dentro de los prÃ³ximos {NEARBY_DAYS} dÃ­as.</span>
              </div>
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
                      <h3>{vuelo.displayName}</h3>
                      <p className="resultados-route">{vuelo.origen} {"->"} {vuelo.destino}</p>

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

                      <Link to={`/vuelo/${vuelo.localProductId || vuelo.id || vuelo.productId}`} state={{ vuelo: { ...vuelo, productId: vuelo.localProductId || vuelo.productId || vuelo.id } }}>
                        <button className="btn-detalle">Ver detalle</button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && listaMostrada.length > 0 && (
              <Paginacion
                totalItems={listaMostrada.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
