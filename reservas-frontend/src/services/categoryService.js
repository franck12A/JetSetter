import axios from "axios";

const API_URL = "http://localhost:8080";

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

const parseApiError = (error, fallback) => {
  const payload = error?.response?.data;
  if (typeof payload === "string" && payload.trim()) return payload;
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return fallback;
};

const categoryService = {
  getAll: async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/categories`, { headers: getHeaders() });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Error al obtener categorias:", error);
      return [];
    }
  },

  getById: async (id) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/categories/${id}`, { headers: getHeaders() });
      return data;
    } catch (error) {
      console.error("Error al obtener categoria por ID:", error);
      return null;
    }
  },

  createCategory: async (category) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/categories`, category, { headers: getHeaders() });
      return data;
    } catch (error) {
      throw new Error(parseApiError(error, "No se pudo crear la categoria."));
    }
  },

  deleteCategory: async (id) => {
    try {
      const { data } = await axios.delete(`${API_URL}/api/categories/${id}`, { headers: getHeaders() });
      return data;
    } catch (error) {
      throw new Error(parseApiError(error, "No se pudo eliminar la categoria."));
    }
  },
};

export default categoryService;
