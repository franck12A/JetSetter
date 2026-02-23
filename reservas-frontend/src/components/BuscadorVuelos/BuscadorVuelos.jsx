import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DateRangePicker } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./BuscadorVuelos.css";

import productService from "../../services/productService";

export default function BuscadorVuelos({ categorias = [], backendVuelos = [], onFiltrar }) {
  const navigate = useNavigate();

  const [pasajeros, setPasajeros] = useState(1);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fecha, setFecha] = useState({ startDate: null, endDate: null, key: "selection" });
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [vuelos, setVuelos] = useState(backendVuelos);

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
    let vuelosBackend = backendVuelos.filter(v => {
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
            const okOrigen = p.origin === origen;
            const okDestino = p.destination === destino;
            const okFecha = p.departureDate?.startsWith(fechaISO);
            const okCategoria = categoriaSeleccionada ? p.category?.name === categoriaSeleccionada : true;
            return okOrigen && okDestino && okFecha && okCategoria;
          })
          .map(p => ({
            ...p,
            origen: p.origin,
            destino: p.destination,
            fechaSalida: p.departureDate,
            fechaLlegada: p.arrivalDate,
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
    <div className="bg-light py-4">
      <div className="container">
        <div className="search-container">
          <div className="search-wrapper">
            <div className="search-header">
              <div className="search-input-group" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="search-select">
                  <option value="">Origen</option>
                  {origenesDisponibles.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>

                <select value={destino} onChange={(e) => setDestino(e.target.value)} className="search-select">
                  <option value="">Destino</option>
                  {destinosDisponibles.map(d => <option key={d.key} value={d.key}>{d.label}</option>)}
                </select>

                <button
                  onClick={handleBuscar}
                  style={{
                    backgroundColor: "#00bfff",
                    color: "#fff",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "0.25rem",
                    cursor: "pointer",
                    fontWeight: "bold"
                  }}
                >
                  Buscar
                </button>
              </div>

              <div className="quick-filters">
                <span className="quick-filter">Pasajeros: {pasajeros}</span>
                <span className="quick-filter" onClick={() => setShowDatePicker(!showDatePicker)}>
                  {fecha.startDate && fecha.endDate
                    ? `${fecha.startDate.toLocaleDateString()} - ${fecha.endDate.toLocaleDateString()}`
                    : "Seleccionar fechas"}
                </span>
              </div>
            </div>

            <div className="category-filters">
              {categorias.map((c) => (
                <div
                  key={c.id || c.name}
                  className={`filter-chip ${categoriaSeleccionada === c.name ? "active" : ""}`}
                  onClick={() => setCategoriaSeleccionada(c.name)}
                >
                  {c.icon && <i className={c.icon}></i>} {c.name}
                </div>
              ))}

              {showDatePicker && (
                <div className="date-range-wrapper active">
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
        </div>
      </div>
    </div>
  );
}
