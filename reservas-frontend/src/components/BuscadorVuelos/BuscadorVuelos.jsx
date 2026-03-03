import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "react-date-range";
import { FaPlaneDeparture, FaPlaneArrival, FaUser, FaRegCalendarAlt, FaSearch } from "react-icons/fa";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./BuscadorVuelos.css";

import productService from "../../services/productService";
import { getSafeIcon } from "../../utils/iconRegistry";

const splitRoute = (name = "") => {
  const clean = name.replace(/^Vuelo\s+/i, "");
  const parts = clean.split(/→|->/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return { origen: parts[0], destino: parts[1] };
  }
  return { origen: clean || "N/A", destino: "N/A" };
};

export default function BuscadorVuelos({ categorias = [], backendVuelos = [], vuelosRaw = [], onFiltrar }) {
  const navigate = useNavigate();
  const sourceVuelos = backendVuelos.length ? backendVuelos : vuelosRaw;

  const [pasajeros, setPasajeros] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fecha, setFecha] = useState({ startDate: null, endDate: null, key: "selection" });
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [vuelos, setVuelos] = useState(sourceVuelos);

  // ------------------ ORÍGENES -----------------
  const origenesDisponibles = useMemo(() => {
    const setOrigen = new Set();
    vuelos.forEach(v => setOrigen.add(v.origen));
    return Array.from(setOrigen).sort().map(o => ({ key: o, label: o }));
  }, [vuelos]);

  // ------------------ DESTINOS -----------------
  const destinosDisponibles = useMemo(() => {
    const setDestino = new Set();
    vuelos.forEach(v => setDestino.add(v.destino));
    return Array.from(setDestino).sort().map(d => ({ key: d, label: d }));
  }, [vuelos]);

  // ------------------ BUSCAR -----------------
  const handleBuscar = async () => {
    const fechaISO = fecha.startDate?.toISOString().split("T")[0];

    // ---------------- Backend interno ----------------
    let vuelosBackend = sourceVuelos.filter(v => {
      const okOrigen = origen ? v.origen === origen : true;
      const okDestino = destino ? v.destino === destino : true;
      const okFecha = fechaISO ? v.fechaSalida?.startsWith(fechaISO) : true;
      const okCategoria = categoriaSeleccionada ? v.categorias?.includes(categoriaSeleccionada) : true;
      return okOrigen && okDestino && okFecha && okCategoria;
    });

    // ---------------- ProductService ----------------
    if (origen && destino && fechaISO) {
      try {
        const productos = await productService.getAllProducts();

        const vuelosService = productos
          .filter(p => {
            const route = splitRoute(p.name);
            const okOrigen = route.origen === origen;
            const okDestino = route.destino === destino;
            const okFecha = p.departureDate?.startsWith(fechaISO);
            const okCategoria = categoriaSeleccionada ? p.category?.name === categoriaSeleccionada : true;
            return okOrigen && okDestino && okFecha && okCategoria;
          })
          .map(p => ({
            ...p,
            ...splitRoute(p.name),
            fechaSalida: p.departureDate,
            fechaLlegada: null,
            categorias: [p.category?.name || "Otros"],
            caracteristicas: p.features?.map(f => f.title || f.name) || ["Clase: Lite", "Equipaje incluido: No"],
          }));

        vuelosBackend = [...vuelosBackend, ...vuelosService];
      } catch (err) {
        console.error("Error obteniendo vuelos desde productService:", err);
      }
    }

    setVuelos(vuelosBackend);
    onFiltrar(vuelosBackend);
    navigate("/resultados");
  };

  return (
    <div className="hero-section">
      <div className="search-wrapper">
        <h1 className="hero-title">¿A dónde volamos hoy?</h1>

        <div className="search-row-full">
          {/* Origen Pill */}
          <div className="search-pill">
            <FaPlaneDeparture className="pill-icon" />
            <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="search-select">
              <option value="">Origen</option>
              {origenesDisponibles.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
            </select>
          </div>

          {/* Destino Pill */}
          <div className="search-pill">
            <FaPlaneArrival className="pill-icon" />
            <select value={destino} onChange={(e) => setDestino(e.target.value)} className="search-select">
              <option value="">Destino</option>
              {destinosDisponibles.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
            </select>
          </div>
        </div>

        <div className="search-row-auto">
          {/* Pasajeros Pill */}
          <div className="search-pill">
            <FaUser className="pill-icon" />
            <span className="search-pill-text">Pasajeros: {pasajeros}</span>
          </div>

          {/* Fechas Pill */}
          <div className="search-pill relative" onClick={() => setShowDatePicker(!showDatePicker)}>
            <FaRegCalendarAlt className="pill-icon" />
            <span className="search-pill-text">
              {fecha.startDate && fecha.endDate
                ? `${fecha.startDate.toLocaleDateString()} - ${fecha.endDate.toLocaleDateString()}`
                : "Seleccionar fechas"}
            </span>

            {showDatePicker && (
              <div className="date-range-wrapper" onClick={(e) => e.stopPropagation()}>
                <DateRangePicker
                  ranges={[{
                    startDate: fecha.startDate || new Date(),
                    endDate: fecha.endDate || new Date(),
                    key: "selection"
                  }]}
                  onChange={(item) => setFecha({
                    startDate: item.selection.startDate,
                    endDate: item.selection.endDate,
                    key: "selection"
                  })}
                  showSelectionPreview
                  moveRangeOnFirstSelection={false}
                  editableDateInputs
                />
              </div>
            )}
          </div>
        </div>

        {/* Botón Buscar Completo ancho */}
        <button onClick={handleBuscar} className="search-btn">
          <FaSearch className="btn-icon" />
          Buscar Vuelos
        </button>
      </div>
    </div>
  );
}
