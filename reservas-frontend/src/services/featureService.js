import axios from "axios";

const API_URL = "http://localhost:8080/api/features";

export const getFeatures = () => axios.get(API_URL);

export const createFeature = (data) => axios.post(API_URL, data);

export const updateFeature = (id, data) => axios.put(`${API_URL}/${id}`, data);

export const deleteFeature = (id) => axios.delete(`${API_URL}/${id}`);
