import axios from "axios";
import { API_URL } from "../config/api.config.js";

export const getAdoptionsRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/adoptions`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener adopciones:", error);
    throw error;
  }
};

export const approveAdoptionRequest = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/adoptions/${id}/approve`);
    return response.data;
  } catch (error) {
    console.error("Error al aprobar adopción:", error);
    throw error;
  }
};

export const rejectAdoptionRequest = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/adoptions/${id}/reject`);
    return response.data;
  } catch (error) {
    console.error("Error al rechazar adopción:", error);
    throw error;
  }
};

// Función para crear una nueva adopción
export const createAdoptionRequest = async (adoptionData) => {
  try {
    console.log("Enviando datos de adopción:", adoptionData);
    const response = await axios.post(`${API_URL}/adoptions`, adoptionData);
    return response.data;
  } catch (error) {
    console.error("Error al crear adopción:", error);
    console.error("Datos enviados:", adoptionData);
    console.error("Respuesta del servidor:", error.response?.data);
    console.error("Status del error:", error.response?.status);
    throw error;
  }
};

export const deleteAdoptionRequest = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/adoptions/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar adopción:", error);
    throw error;
  }
};
