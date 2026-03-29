// src/services/categoryService.js
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

// ---------------- CATEGORY SERVICE ----------------
const categoryService = {

  // Obtener todas las categorías
  getAll: async () => {
    const token = obtenerToken();
    try {
      const { data } = await axios.get(`${API_URL}/api/categories`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      return data;
    } catch (error) {
      console.error("Error al obtener categorías:", error);
      return [];
    }
  },

  // Obtener categoría por ID
  getById: async (id) => {
    const token = obtenerToken();
    try {
      const { data } = await axios.get(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      return data;
    } catch (error) {
      console.error("Error al obtener categoría por ID:", error);
      return null;
    }
  },

  // Crear categoría
  createCategory: async (category) => {
    const token = obtenerToken();
    try {
      const { data } = await axios.post(`${API_URL}/api/categories`, category, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      return data;
    } catch (error) {
      console.error("Error al crear categoría:", error);
      return null;
    }
  },

  // Eliminar categoría
  deleteCategory: async (id) => {
    const token = obtenerToken();
    try {
      const { data } = await axios.delete(`/api/categories/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      return data;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error("Categoría no encontrada o ya fue eliminada");
      }
      throw error;
    }
  },

};

export default categoryService;
