// src/services/categoryService.js
import axios from "axios";

const API_URL = "http://localhost:8080";

// ---------------- TOKEN ----------------
const obtenerToken = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  return user?.token || null;
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
      const { data } = await axios.delete(`${API_URL}/api/categories/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
      return data;
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      return null;
    }
  },

};

export default categoryService;
