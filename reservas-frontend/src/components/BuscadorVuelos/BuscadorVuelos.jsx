import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaPlaneDeparture, FaPlaneArrival, FaUser, FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./BuscadorVuelos.css";

const splitRoute = (name = "") => {
  const clean = String(name || "").replace(/^Vuelo\s+/i, "").trim();
  const parts = clean.split(/->|→/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { origen: parts[0], destino: parts[1] };
  }
  return { origen: clean || "N/A", destino: "N/A" };
};

const normalizeText = (value = "") =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
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

export default function BuscadorVuelos({
  categorias = [],
  backendVuelos = [],
  vuelosRaw = [],
  onFiltrar,
  onBuscar,
  navigateOnSearch = true,
}) {
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
  const [tripType, setTripType] = useState("round");
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [origenQuery, setOrigenQuery] = useState("");
  const [destinoQuery, setDestinoQuery] = useState("");

  const salidaLabel = formatDateLabel(fechaSalida);
  const regresoLabel = formatDateLabel(fechaRegreso);
  const focusLabel = activeDatePicker === "regreso" ? "Regreso" : "Salida";

  const rangeSelection = useMemo(() => {
    const startDate = fechaSalida
      ? new Date(`${fechaSalida}T00:00:00`)
      : new Date();
    const endDate = fechaRegreso
      ? new Date(`${fechaRegreso}T00:00:00`)
      : startDate;
    return {
      startDate,
      endDate,
      key: "selection",
    };
  }, [fechaSalida, fechaRegreso]);

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
    if (typeof onBuscar === "function") onBuscar({ filtros: { origen, destino, fechaSalida, fechaRegreso, categoriaSeleccionada, pasajeros }, filtrados });

    const params = new URLSearchParams();
    if (origen) params.set("origen", origen);
    if (destino) params.set("destino", destino);
    if (fechaSalida) params.set("fechaSalida", fechaSalida);
    if (fechaRegreso) params.set("fechaRegreso", fechaRegreso);
    if (categoriaSeleccionada) params.set("categoria", categoriaSeleccionada);
    if (pasajeros > 1) params.set("pasajeros", String(pasajeros));

    if (navigateOnSearch) {
      navigate(`/resultados${params.toString() ? `?${params.toString()}` : ""}`);
    }
  };

  const handleTripType = (nextType) => {
    setTripType(nextType);
    if (nextType === "oneway") {
      setFechaRegreso("");
      setActiveDatePicker("salida");
    }
  };

  const decrementPassengers = () => {
    setPasajeros((prev) => Math.max(1, prev - 1));
  };

  const incrementPassengers = () => {
    setPasajeros((prev) => Math.min(9, prev + 1));
  };

  return (
    <div className="hero-section">
      <div className="search-wrapper buscador-modern">
        <h1 className="hero-title">
          A donde quieres
          <span className="title-accent">viajar?</span>
        </h1>
        <p className="hero-subtitle">
          Selecciona origen, destino y fechas de salida y regreso para encontrar los vuelos mas relevantes.
        </p>

        <div className="search-tabs">
          <button
            type="button"
            className={`search-tab ${tripType === "round" ? "is-active" : ""}`}
            onClick={() => handleTripType("round")}
          >
            Ida y vuelta
          </button>
          <button
            type="button"
            className={`search-tab ${tripType === "oneway" ? "is-active" : ""}`}
            onClick={() => handleTripType("oneway")}
          >
            Solo ida
          </button>
        </div>

        <div className="search-grid">
          <div className="search-field" ref={origenRef}>
            <div className="field-label">Origen</div>
            <div className="field-control">
              <FaPlaneDeparture className="field-icon" />
              <button
                type="button"
                className="field-trigger"
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

          <div className="search-field" ref={destinoRef}>
            <div className="field-label">Destino</div>
            <div className="field-control">
              <FaPlaneArrival className="field-icon" />
              <button
                type="button"
                className="field-trigger"
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

        <div className="search-grid">
          <div className="search-field search-field-dates" ref={fechaRef}>
            <div className="field-label">Salida</div>
            <button
              type="button"
              className="field-trigger field-trigger-date"
              onClick={() => {
                setActiveDatePicker("salida");
                setActiveDropdown("fecha");
              }}
            >
              <FaRegCalendarAlt className="field-icon" />
              <span>{salidaLabel || "Seleccionar"}</span>
            </button>
            {activeDropdown === "fecha" && (
              <div className="date-panel">
                <div className="date-panel-head">Seleccionando: {focusLabel}</div>
                <DateRange
                  ranges={[rangeSelection]}
                  onChange={(ranges) => {
                    const selection = ranges.selection;
                    const startISO = asDateISO(selection?.startDate);
                    const endISO = asDateISO(selection?.endDate);
                    setFechaSalida(startISO);
                    setFechaRegreso(tripType === "oneway" ? "" : endISO);
                    if (startISO && endISO) {
                      setActiveDropdown(null);
                    }
                  }}
                  moveRangeOnFirstSelection={false}
                  minDate={new Date()}
                  months={2}
                  direction="horizontal"
                  rangeColors={["#2563eb"]}
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

          <div className={`search-field search-field-dates ${tripType === "oneway" ? "is-disabled" : ""}`}>
            <div className="field-label">Regreso</div>
            <button
              type="button"
              className="field-trigger field-trigger-date"
              onClick={() => {
                if (tripType === "oneway") return;
                setActiveDatePicker("regreso");
                setActiveDropdown("fecha");
              }}
              disabled={tripType === "oneway"}
            >
              <FaRegCalendarAlt className="field-icon" />
              <span>{regresoLabel || "Seleccionar"}</span>
            </button>
          </div>

          <div className="search-passengers">
            <div className="passenger-info">
              <div className="field-label">Viajeros y clase</div>
              <div className="passenger-value">
                <FaUser className="passenger-icon" />
                {pasajeros} {pasajeros === 1 ? "Adulto" : "Adultos"}, Económica
              </div>
            </div>
            <div className="passenger-actions">
              <button type="button" className="passenger-btn" onClick={decrementPassengers} aria-label="Restar pasajero">
                -
              </button>
              <button type="button" className="passenger-btn" onClick={incrementPassengers} aria-label="Sumar pasajero">
                +
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleBuscar} className="search-btn">
          <FaSearch className="btn-icon" />
          Realizar búsqueda
        </button>
      </div>
    </div>
  );
}
