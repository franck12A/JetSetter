// src/services/vuelosService.js
import axios from "axios";

const API_URL = "http://localhost:8080";

// ---------------- TOKEN ----------------
const obtenerToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
};

// ---------------- UTILIDADES ----------------
const formatearFecha = (isoFecha) => {
  if (!isoFecha) return "-";
  const fecha = new Date(isoFecha);
  const dia = fecha.getDate().toString().padStart(2, "0");
  const mes = (fecha.getMonth() + 1).toString().padStart(2, "0");
  const año = fecha.getFullYear();
  const horas = fecha.getHours().toString().padStart(2, "0");
  const minutos = fecha.getMinutes().toString().padStart(2, "0");
  return `${dia}/${mes}/${año} ${horas}:${minutos}`;
};

const calcularDuracion = (inicio, fin) => {
  const start = new Date(inicio);
  const end = new Date(fin);
  let diff = (end - start) / 1000 / 60; // minutos
  if (diff < 0) diff += 24 * 60;
  const horas = Math.floor(diff / 60);
  const minutos = Math.round(diff % 60);
  return `${horas}h ${minutos}m`;
};

// ---------------- OBTENER VUELOS ----------------
export const obtenerVuelos = async (origen, destino, fecha) => {
  if (!origen || !destino || !fecha) return [];

  const token = obtenerToken();

  try {
    const { data } = await axios.get(`${API_URL}/amadeus/buscar`, {
      params: { origen, destino, fecha },
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });

    if (!data || !Array.isArray(data)) return [];

    return data.map((vuelo) => {
      const primerSegmento = vuelo.segmentos?.[0] || {};
      const ultimoSegmento = vuelo.segmentos?.[vuelo.segmentos.length - 1] || {};

      return {
        id: vuelo.id,
        productId: vuelo.productId ?? (Number.isInteger(Number(vuelo.id)) ? Number(vuelo.id) : null),
        aerolinea: primerSegmento.aerolinea || vuelo.aerolinea || "Desconocida",
        numeroVuelo: primerSegmento.numeroVuelo || vuelo.numeroVuelo || "000",
        precioTotal: vuelo.precioTotal || 0,
        categorias: vuelo.categorias || (vuelo.categoria ? [vuelo.categoria] : ["Otros"]),
        caracteristicas: vuelo.caracteristicas?.length > 0
          ? vuelo.caracteristicas
          : [
              `Duración aproximada: ${primerSegmento.salida && ultimoSegmento.llegada
                ? calcularDuracion(primerSegmento.salida, ultimoSegmento.llegada)
                : "Desconocida"}`,
              "Clase: Lite",
              "Equipaje incluido: No"
            ],
        imagenPrincipal: vuelo.imagenPrincipal || "/assets/default.jpg",
        imagenesPais: vuelo.imagenesPais || ["/assets/default.jpg"],
        origen: vuelo.origen,
        destino: vuelo.destino,
        segmentos: vuelo.segmentos || [],
        fechaSalida: formatearFecha(vuelo.fechaSalida || primerSegmento.salida),
        fechaLlegada: formatearFecha(vuelo.fechaLlegada || ultimoSegmento.llegada),
      };
    });

  } catch (error) {
    console.error("Error al obtener vuelos:", error);
    return [];
  }
};

// ---------------- OBTENER VUELO POR ID ----------------
export const obtenerVueloPorId = async (id) => {
  if (!id) return null;

  const token = obtenerToken();

  try {
    const { data } = await axios.get(`${API_URL}/amadeus/vuelos/${id}`, {
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });

    if (!data) return null;

    const primerSegmento = data.segmentos?.[0] || {};
    const ultimoSegmento =
      data.segmentos?.[data.segmentos.length - 1] || {};

    return {
      id: data.id,
      productId: data.productId ?? (Number.isInteger(Number(data.id)) ? Number(data.id) : null),
      aerolinea: data.aerolinea || primerSegmento.aerolinea || "Desconocida",
      numeroVuelo: data.numeroVuelo || primerSegmento.numeroVuelo || "000",

      precioTotal: data.precioTotal || 0,
      categorias: data.categorias || [data.categoria] || ["Otros"],

      caracteristicas: data.caracteristicas?.length
        ? data.caracteristicas
        : [
            `Duración aproximada: ${
              primerSegmento.salida && ultimoSegmento.llegada
                ? calcularDuracion(primerSegmento.salida, ultimoSegmento.llegada)
                : "Desconocida"
            }`,
            "Clase: Lite",
            "Equipaje incluido: No",
          ],

      imagenPrincipal: data.imagenPrincipal || "/assets/default.jpg",
      imagenesPais: data.imagenesPais || ["/assets/default.jpg"],

      origen: data.origen,
      destino: data.destino,

      segmentos: data.segmentos || [],

      fechaSalida: formatearFecha(data.fechaSalida || primerSegmento.salida),
      fechaLlegada: formatearFecha(
        data.fechaLlegada || ultimoSegmento.llegada
      ),
    };

  } catch (error) {
    console.error("Error al obtener vuelo por ID:", error);
    return null;
  }
};
