import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture, FaPlaneArrival, FaUser, FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import { Calendar } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./BuscadorVuelos.css";

const splitRoute = (name = "") => {
  const clean = String(name || "").replace(/^Vuelo\s+/i, "").trim();
  const parts = clean.split(/->|\u2192/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { origen: parts[0], destino: parts[1] };
  }
  return { origen: clean || "N/A", destino: "N/A" };
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const asDateISO = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const formatDateLabel = (value) => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
};

const formatDateRangeLabel = (salida, regreso) => {
  const salidaLabel = formatDateLabel(salida);
  const regresoLabel = formatDateLabel(regreso);
  if (!salidaLabel && !regresoLabel) return "Selecciona salida y regreso";
  if (salidaLabel && regresoLabel && salidaLabel !== regresoLabel) {
    return `Salida: ${salidaLabel} · Regreso: ${regresoLabel}`;
  }
  if (salidaLabel) return `Salida: ${salidaLabel}`;
  return `Regreso: ${regresoLabel}`;
};

const normalizeVuelo = (vuelo = {}) => {
  const route = splitRoute(vuelo.name);
  return {
    ...vuelo,
    origen: vuelo.origen || vuelo.origin || route.origen,
    destino: vuelo.destino || vuelo.destination || route.destino,
    fechaISO: asDateISO(vuelo.fechaSalida || vuelo.departureDate || vuelo.date),
    categoria:
      vuelo.category?.name ||
      vuelo.category ||
      (Array.isArray(vuelo.categorias) ? vuelo.categorias[0] : "") ||
      "",
  };
};

export default function BuscadorVuelos({ categorias = [], backendVuelos = [], vuelosRaw = [], onFiltrar }) {
  const navigate = useNavigate();

  const sourceVuelos = useMemo(
    () => (backendVuelos.length ? backendVuelos : vuelosRaw).map(normalizeVuelo),
    [backendVuelos, vuelosRaw]
  );

  const [pasajeros, setPasajeros] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [fechaRegreso, setFechaRegreso] = useState("");
  const [activeDatePicker, setActiveDatePicker] = useState("salida");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [origenQuery, setOrigenQuery] = useState("");
  const [destinoQuery, setDestinoQuery] = useState("");

  const salidaLabel = formatDateLabel(fechaSalida);
  const regresoLabel = formatDateLabel(fechaRegreso);
  const focusLabel = activeDatePicker === "regreso" ? "Regreso" : "Salida";

  const origenRef = useRef(null);
  const destinoRef = useRef(null);
  const fechaRef = useRef(null);

  const origenesDisponibles = useMemo(() => {
    const seen = new Set();
    sourceVuelos.forEach((v) => {
      const canUse = !destino || normalizeText(v.destino) === normalizeText(destino);
      if (canUse && v.origen) seen.add(v.origen);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "es"));
  }, [sourceVuelos, destino]);

  const destinosDisponibles = useMemo(() => {
    const seen = new Set();
    sourceVuelos.forEach((v) => {
      const canUse = !origen || normalizeText(v.origen) === normalizeText(origen);
      if (canUse && v.destino) seen.add(v.destino);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b, "es"));
  }, [sourceVuelos, origen]);

  const origenesFiltrados = useMemo(
    () => origenesDisponibles.filter((item) => normalizeText(item).includes(normalizeText(origenQuery))),
    [origenesDisponibles, origenQuery]
  );

  const destinosFiltrados = useMemo(
    () => destinosDisponibles.filter((item) => normalizeText(item).includes(normalizeText(destinoQuery))),
    [destinosDisponibles, destinoQuery]
  );

  useEffect(() => {
    const onClickOutside = (event) => {
      const insideOrigen = origenRef.current?.contains(event.target);
      const insideDestino = destinoRef.current?.contains(event.target);
      const insideFecha = fechaRef.current?.contains(event.target);
      if (!insideOrigen && !insideDestino && !insideFecha) setActiveDropdown(null);
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleBuscar = () => {
    const fechaInicio = fechaSalida || fechaRegreso;
    const fechaFin = fechaRegreso || fechaSalida;
    const hasDateRange = Boolean(fechaInicio);

    const filtrados = sourceVuelos.filter((v) => {
      const okOrigen = !origen || normalizeText(v.origen) === normalizeText(origen);
      const okDestino = !destino || normalizeText(v.destino) === normalizeText(destino);
      const okFecha =
        !hasDateRange ||
        (v.fechaISO &&
          fechaInicio &&
          fechaFin &&
          v.fechaISO >= fechaInicio &&
          v.fechaISO <= fechaFin);
      const okCategoria = !categoriaSeleccionada || normalizeText(v.categoria) === normalizeText(categoriaSeleccionada);
      return okOrigen && okDestino && okFecha && okCategoria;
    });

    if (typeof onFiltrar === "function") onFiltrar(filtrados);

    const params = new URLSearchParams();
    if (origen) params.set("origen", origen);
    if (destino) params.set("destino", destino);
    if (fechaSalida) params.set("fechaSalida", fechaSalida);
    if (fechaRegreso) params.set("fechaRegreso", fechaRegreso);
    if (categoriaSeleccionada) params.set("categoria", categoriaSeleccionada);
    if (pasajeros > 1) params.set("pasajeros", String(pasajeros));

    navigate(`/resultados${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div className="hero-section">
      <div className="search-wrapper">
        <h1 className="hero-title">A donde quieres viajar?</h1>
        <p className="hero-subtitle">
          Selecciona origen, destino y fechas de salida y regreso para encontrar los vuelos mas relevantes.
        </p>

        <div className="search-row-full">
          <div className="search-pill search-pill-control" ref={origenRef}>
            <FaPlaneDeparture className="pill-icon" />
            <div className="control-stack">
              <span className="control-label">Origen</span>
              <button
                type="button"
                className="control-trigger"
                onClick={() => setActiveDropdown((prev) => (prev === "origen" ? null : "origen"))}
              >
                {origen || "Seleccionar origen"}
              </button>
            </div>

            {activeDropdown === "origen" && (
              <div className="dropdown-panel">
                <input
                  type="text"
                  className="dropdown-search"
                  placeholder="Buscar origen..."
                  value={origenQuery}
                  onChange={(e) => setOrigenQuery(e.target.value)}
                />

                <div className="dropdown-list">
                  <button
                    type="button"
                    className={`dropdown-item ${origen === "" ? "is-active" : ""}`}
                    onClick={() => {
                      setOrigen("");
                      setOrigenQuery("");
                      setActiveDropdown(null);
                    }}
                  >
                    Cualquiera
                  </button>

                  {origenesFiltrados.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`dropdown-item ${origen === item ? "is-active" : ""}`}
                      onClick={() => {
                        setOrigen(item);
                        setOrigenQuery("");
                        setActiveDropdown(null);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="search-pill search-pill-control" ref={destinoRef}>
            <FaPlaneArrival className="pill-icon" />
            <div className="control-stack">
              <span className="control-label">Destino</span>
              <button
                type="button"
                className="control-trigger"
                onClick={() => setActiveDropdown((prev) => (prev === "destino" ? null : "destino"))}
              >
                {destino || "Seleccionar destino"}
              </button>
            </div>

            {activeDropdown === "destino" && (
              <div className="dropdown-panel">
                <input
                  type="text"
                  className="dropdown-search"
                  placeholder="Buscar destino..."
                  value={destinoQuery}
                  onChange={(e) => setDestinoQuery(e.target.value)}
                />

                <div className="dropdown-list">
                  <button
                    type="button"
                    className={`dropdown-item ${destino === "" ? "is-active" : ""}`}
                    onClick={() => {
                      setDestino("");
                      setDestinoQuery("");
                      setActiveDropdown(null);
                    }}
                  >
                    Cualquiera
                  </button>

                  {destinosFiltrados.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className={`dropdown-item ${destino === item ? "is-active" : ""}`}
                      onClick={() => {
                        setDestino(item);
                        setDestinoQuery("");
                        setActiveDropdown(null);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="search-row-auto">
          <div className="search-pill search-pill-control">
            <FaUser className="pill-icon" />
            <div className="control-stack">
              <label className="control-label" htmlFor="pasajeros-input">
                Pasajeros
              </label>
              <input
                id="pasajeros-input"
                type="number"
                min="1"
                max="9"
                className="search-input-number control-input"
                value={pasajeros}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setPasajeros(Number.isInteger(next) && next > 0 ? next : 1);
                }}
              />
            </div>
          </div>

          <div className="search-pill search-pill-control" ref={fechaRef}>
            <FaRegCalendarAlt className="pill-icon" />
            <div className="control-stack">
              <span className="control-label">Salida y regreso</span>
              <div className="date-buttons">
                <button
                  type="button"
                  className="date-trigger"
                  onClick={() => {
                    setActiveDatePicker("salida");
                    setActiveDropdown("fecha");
                  }}
                >
                  <span className="date-trigger-label">Salida</span>
                  <span className="date-trigger-value">{salidaLabel || "Seleccionar"}</span>
                </button>
                <button
                  type="button"
                  className="date-trigger"
                  onClick={() => {
                    setActiveDatePicker("regreso");
                    setActiveDropdown("fecha");
                  }}
                >
                  <span className="date-trigger-label">Regreso</span>
                  <span className="date-trigger-value">{regresoLabel || "Seleccionar"}</span>
                </button>
              </div>
              <div className="control-hint">
                {formatDateRangeLabel(fechaSalida, fechaRegreso)}
              </div>
            </div>

            {activeDropdown === "fecha" && (
              <div className="date-panel">
                <div className="date-panel-head">Seleccionando: {focusLabel}</div>
                <Calendar
                  date={
                    activeDatePicker === "regreso"
                      ? (fechaRegreso
                        ? new Date(`${fechaRegreso}T00:00:00`)
                        : (fechaSalida ? new Date(`${fechaSalida}T00:00:00`) : new Date()))
                      : (fechaSalida
                        ? new Date(`${fechaSalida}T00:00:00`)
                        : (fechaRegreso ? new Date(`${fechaRegreso}T00:00:00`) : new Date()))
                  }
                  minDate={
                    activeDatePicker === "regreso" && fechaSalida
                      ? new Date(`${fechaSalida}T00:00:00`)
                      : undefined
                  }
                  maxDate={
                    activeDatePicker === "salida" && fechaRegreso
                      ? new Date(`${fechaRegreso}T00:00:00`)
                      : undefined
                  }
                  onChange={(nextDate) => {
                    const nextISO = asDateISO(nextDate);
                    if (activeDatePicker === "regreso") {
                      setFechaRegreso(nextISO);
                      if (!fechaSalida) setFechaSalida(nextISO);
                    } else {
                      setFechaSalida(nextISO);
                      if (fechaRegreso && nextISO > fechaRegreso) setFechaRegreso("");
                    }
                    setActiveDropdown(null);
                  }}
                  color="#2563eb"
                />

                {(fechaSalida || fechaRegreso) && (
                  <button
                    type="button"
                    className="date-clear-btn"
                    onClick={() => {
                      setFechaSalida("");
                      setFechaRegreso("");
                      setActiveDatePicker("salida");
                      setActiveDropdown(null);
                    }}
                  >
                    Limpiar fechas
                  </button>
                )}
              </div>
            )}
          </div>

          {categorias.length > 0 && (
            <div className="search-pill search-pill-control">
              <div className="control-stack">
                <label className="control-label" htmlFor="categoria-select">
                  Categoria
                </label>
                <select
                  id="categoria-select"
                  value={categoriaSeleccionada}
                  onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                  className="search-select control-input"
                >
                  <option value="">Categoria</option>
                  {categorias.map((cat) => {
                    const name = cat?.name || String(cat || "");
                    return (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}
        </div>

        <button onClick={handleBuscar} className="search-btn">
          <FaSearch className="btn-icon" />
          Buscar vuelos
        </button>
      </div>
    </div>
  );
}
