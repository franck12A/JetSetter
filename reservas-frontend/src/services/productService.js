// src/services/productService.js
import axios from "axios";

const API_URL = "http://localhost:8080";

// ---------------- TOKEN ----------------
const obtenerToken = () => {
  try {
    const directToken = localStorage.getItem("token");
    if (directToken && directToken !== "null" && directToken !== "undefined") {
      return directToken.startsWith("Bearer ") ? directToken.slice(7) : directToken;
    }

    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userToken = user?.token;
    if (!userToken || userToken === "null" || userToken === "undefined") return null;
    return userToken.startsWith("Bearer ") ? userToken.slice(7) : userToken;
  } catch {
    return null;
  }
};

const getHeaders = () => {
  const token = obtenerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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

// ---------------- PRODUCT SERVICE ----------------
const productService = {

  // ---------------- VUELOS API ----------------
obtenerVuelosAPI: async (origen, destino, fecha, limit = 20) => {

  const token = obtenerToken();

  try {
    const endpoint = (origen && destino && fecha) ? "/amadeus/buscar" : "/amadeus/random";
    const params = (origen && destino && fecha)
      ? { origen, destino, fecha, limit }
      : { limit };

    const { data } = await axios.get(`${API_URL}${endpoint}`, {
      params,
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });

    if (!data || !Array.isArray(data)) return [];

    return data.map((vuelo) => {
      const primerSegmento = vuelo.segmentos?.[0] || {};
      const ultimoSegmento = vuelo.segmentos?.[vuelo.segmentos.length - 1] || {};

      // Normalizamos características
      const caracteristicas = vuelo.caracteristicas?.length
        ? vuelo.caracteristicas
        : vuelo.features?.map(f => f.name) || [
            `Duración aproximada: ${primerSegmento.salida && ultimoSegmento.llegada ? calcularDuracion(primerSegmento.salida, ultimoSegmento.llegada) : "Desconocida"}`,
            "Clase: Lite",
            "Equipaje incluido: No"
          ];

      return {
        id: vuelo.id,
        productId: vuelo.productId ?? (Number.isInteger(Number(vuelo.id)) ? Number(vuelo.id) : null),
        aerolinea: vuelo.aerolinea || primerSegmento.aerolinea || "Desconocida",
        numeroVuelo: vuelo.numeroVuelo || primerSegmento.numeroVuelo || "000",
        precioTotal: vuelo.precioTotal || vuelo.price || 0,
        categorias: vuelo.categorias || (vuelo.category ? [vuelo.category.name] : ["Otros"]),
        caracteristicas,
        imagenPrincipal: vuelo.imagenPrincipal || vuelo.image || "/assets/default.jpg",
        imagenesPais: vuelo.imagenesPais || vuelo.imagesBase64 || ["/assets/default.jpg"],
        origen: vuelo.origen || vuelo.name || "-",
        destino: vuelo.destino || "-",
        paisDestino: vuelo.paisDestino || vuelo.country || "-",
        segmentos: vuelo.segmentos?.map(seg => ({
          aerolinea: seg.aerolinea || "Desconocida",
          numeroVuelo: seg.numeroVuelo || "000",
          salida: formatearFecha(seg.salida),
          llegada: formatearFecha(seg.llegada)
        })) || [],
        fechaSalida: formatearFecha(vuelo.fechaSalida || vuelo.departureDate || primerSegmento.salida),
        fechaLlegada: formatearFecha(vuelo.fechaLlegada || ultimoSegmento.llegada || null),
      };
    });

  } catch (error) {
    console.error("Error al obtener vuelos de la API:", error);
    return [];
  }
}
,

 obtenerVueloPorIdAPI: async (id) => {
   if (!id) return null;

   const token = obtenerToken();

   try {
     const { data } = await axios.get(`${API_URL}/amadeus/vuelos/${id}`, {
       headers: { Authorization: token ? `Bearer ${token}` : undefined }
     });

     if (!data) return null;

     const primerSegmento = data.segmentos?.[0] || {};
     const ultimoSegmento = data.segmentos?.[data.segmentos.length - 1] || {};

     // Normalizamos las características
     const caracteristicas = data.caracteristicas?.length
       ? data.caracteristicas
       : data.features?.map(f => f.name) || [
           `Duración aproximada: ${primerSegmento.salida && ultimoSegmento.llegada ? calcularDuracion(primerSegmento.salida, ultimoSegmento.llegada) : "Desconocida"}`,
           "Clase: Lite",
           "Equipaje incluido: No"
         ];

     return {
       id: data.id,
       productId: data.productId ?? (Number.isInteger(Number(data.id)) ? Number(data.id) : null),
       aerolinea: data.aerolinea || primerSegmento.aerolinea || "Desconocida",
       numeroVuelo: data.numeroVuelo || primerSegmento.numeroVuelo || "000",
       precioTotal: data.precioTotal || data.price || 0,
       categorias: data.categorias || (data.category ? [data.category.name] : ["Otros"]),
       caracteristicas,
       imagenPrincipal: data.imagenPrincipal || data.image || "/assets/default.jpg",
       imagenesPais: data.imagenesPais || data.imagesBase64 || ["/assets/default.jpg"],
       origen: data.origen || data.name || "-",
       destino: data.destino || "-",
       paisDestino: data.paisDestino || data.country || "-",
       segmentos: data.segmentos?.map(seg => ({
         aerolinea: seg.aerolinea || "Desconocida",
         numeroVuelo: seg.numeroVuelo || "000",
         salida: seg.salida || null,
         llegada: seg.llegada || null
       })) || [],
       fechaSalida: data.fechaSalida || data.departureDate || primerSegmento.salida || null,
       fechaLlegada: data.fechaLlegada || ultimoSegmento.llegada || null,
     };

   } catch (error) {
     console.error("Error al obtener vuelo por ID de la API:", error);
     return null;
   }
 },


  // ---------------- BACKEND PRODUCTOS ----------------
  getAllProducts: async () => {
    const { data } = await axios.get(`${API_URL}/api/products`, { headers: getHeaders() });
    return data;
  },

  getById: async (id) => {
    const { data } = await axios.get(`${API_URL}/api/products/${id}`, { headers: getHeaders() });
    return data;
  },

  createProduct: async (product) => {
    const { data } = await axios.post(`${API_URL}/api/products`, product, { headers: getHeaders() });
    return data;
  },

  updateProduct: async (id, product) => {
    const { data } = await axios.put(`${API_URL}/api/products/${id}`, product, { headers: getHeaders() });
    return data;
  },

  deleteProduct: async (id) => {
    const { data } = await axios.delete(`${API_URL}/api/products/${id}`, { headers: getHeaders() });
    return data;
  },

  searchProducts: async ({ name, departureDate }) => {
    const params = {};
    if (name) params.name = name;
    if (departureDate) params.departureDate = departureDate;
    const { data } = await axios.get(`${API_URL}/api/products/search`, { params, headers: getHeaders() });
    return data;
  },

 getRandomProducts: async (count = 3) => {
    const { data } = await axios.get(`${API_URL}/api/products/random`, { params: { count }, headers: getHeaders() });
    return data;
  },

  getRandomFlightsPaged: async (page = 0, size = 20) => {
    const token = obtenerToken();
    const { data } = await axios.get(`${API_URL}/amadeus/random/paged`, {
      params: { page, size },
      headers: { Authorization: token ? `Bearer ${token}` : undefined }
    });
    return data;
  },

};

export default productService;
