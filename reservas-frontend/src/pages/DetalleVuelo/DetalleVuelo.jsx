import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import productService from "../../services/productService";
import { getUserFavorites, addFavorite, removeFavorite } from "../../services/favoritesApi";
import { createBooking } from "../../services/bookingsApi";
import VueloCards from "../../components/VueloCards";

import "./DetalleVuelo.css";

export default function DetalleVuelo() {
  const { id } = useParams();
  const user = JSON.parse(localStorage.getItem("user"));

  const [vuelo, setVuelo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const loadVuelo = async () => {
      setLoading(true);
      try {
        // Traemos del backend
        let data = await productService.getById(id);

        if (!data) {
          // Si no existe en backend, buscamos en la API
          data = await productService.obtenerVueloPorIdAPI(id);
        }

        if (!data) {
          setVuelo(null);
          return;
        }

        // Normalizamos campos para que no queden null
  // Normalizamos campos para que no queden null
const vueloNormalizado = {
  ...data,
  aerolinea: data.aerolinea || "Desconocida",
  numeroVuelo: data.numeroVuelo || "000",
  origen: data.origen || data.name || "-",
  destino: data.destino || "-",
  paisDestino: data.paisDestino || data.country || "-",
  caracteristicas: data.features?.map(f => f.name) || ["Clase: Lite", "Equipaje incluido: No"],
  segmentos: data.segmentos || [],
  imagenPrincipal: data.imagenPrincipal || data.image || "/assets/default.jpg",

  // Normalizamos fechas para ambos casos
  fechaSalida: data.fechaSalida
    ? productService.formatearFecha(data.fechaSalida)
    : data.segmentos?.[0]?.salida
      ? productService.formatearFecha(data.segmentos[0].salida)
      : "-",
  fechaLlegada: data.fechaLlegada
    ? productService.formatearFecha(data.fechaLlegada)
    : data.segmentos?.[data.segmentos.length - 1]?.llegada
      ? productService.formatearFecha(data.segmentos[data.segmentos.length - 1].llegada)
      : "-",
};



        setVuelo(vueloNormalizado);

      } catch (err) {
        console.error("Error cargando vuelo:", err);
        setVuelo(null);
      } finally {
        setLoading(false);
      }
    };

    loadVuelo();
  }, [id]);

  useEffect(() => {
    const loadFavs = async () => {
      if (!user || !vuelo) return;

      try {
        const favs = await getUserFavorites();
        setIsFavorite(favs.some(f => f.id === vuelo.id));
      } catch (err) {
        console.error("Error cargando favoritos:", err);
      }
    };

    loadFavs();
  }, [user, vuelo]);

  const handleFavorite = async () => {
    if (!user) return alert("Debes iniciar sesión para agregar favoritos");

    try {
      if (isFavorite) {
        await removeFavorite(vuelo.id);
        setIsFavorite(false);
      } else {
        await addFavorite(vuelo.id);
        setIsFavorite(true);
      }
    } catch (err) {
      alert("Error al actualizar favoritos");
      console.error(err);
    }
  };

  const handleBooking = async () => {
    if (!user) return alert("Debes iniciar sesión para reservar");

    if (!vuelo.fechaSalida || vuelo.fechaSalida === "-") {
      return alert("No se puede reservar: fecha de salida no disponible");
    }

    try {
      // Para enviar al backend, convertimos a ISO sin horas
      const fechaFormateada = vuelo.fechaSalida.split(" ")[0].split("/").reverse().join("-"); // dd/mm/yyyy -> yyyy-mm-dd
      const booking = await createBooking({
        userId: user.id,
        productId: vuelo.id,
        dateStr: fechaFormateada,
        passengers: 1
      });

      alert("Reserva realizada correctamente ✔️");
      setBookings(prev => [...prev, booking]);
    } catch (err) {
      alert("Error al realizar la reserva");
      console.error(err);
    }
  };

  if (loading) return <p>Cargando vuelo...</p>;
  if (!vuelo) return <p>Vuelo no encontrado</p>;

  return (
    <div className="detalle-container">
      <div className="detalle-header">
        <h1 className="detalle-title">{vuelo.aerolinea} - {vuelo.numeroVuelo}</h1>
        <button className="btn-back" onClick={() => window.history.back()}>← Volver</button>
      </div>

      <div className="detalle-main">
        <div className="galeria-principal">
          <img
            src={vuelo.imagenPrincipal}
            alt={vuelo.aerolinea}
          />
        </div>

        <div className="detalle-info">
          {/* Tarjeta completa */}
          <VueloCards vuelo={vuelo} showImage={false}/>

          <p>
            Descripción: Aerolínea: {vuelo.aerolinea} | Vuelo: {vuelo.numeroVuelo} | Salida: {vuelo.fechaSalida} | Llegada: {vuelo.fechaLlegada}
          </p>

          <div className="detalle-actions">
            <button className="btn-primary" onClick={handleBooking}>Reservar</button>
            <button className="btn-fav" onClick={handleFavorite}>
              {isFavorite ? "💖 Favorito" : "🤍 Agregar a favoritos"}
            </button>
          </div>

          {bookings.length > 0 && (
            <div className="detalle-bookings mt-4">
              <h3>✈️ Mis reservas de este vuelo</h3>
              <ul>
                {bookings.map(b => (
                  <li key={b.id}>
                    Fecha: {new Date(b.bookingDate).toLocaleDateString("es-AR")} | Pasajeros: {b.passengers} | Estado: {b.status}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
