import axios from "axios";

const API_URL = "http://localhost:8080/api/features";

function getToken() {
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
}

function getHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export const getFeatures = () => axios.get(API_URL, { headers: getHeaders() });

export const createFeature = (data) => axios.post(API_URL, data, { headers: getHeaders() });

export const updateFeature = (id, data) =>
  axios.put(`${API_URL}/${id}`, data, { headers: getHeaders() });

export const deleteFeature = async (id) => {
  try {
    const { data } = await axios.delete(`/api/features/${id}`, { headers: getHeaders() });
    return data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      throw new Error("Característica no encontrada o ya fue eliminada");
    }
    throw error;
  }
};
