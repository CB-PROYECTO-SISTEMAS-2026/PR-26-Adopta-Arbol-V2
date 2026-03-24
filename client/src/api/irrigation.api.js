import axios from "axios";
import { API_URL } from "../config/api.config.js";

// Función para obtener todos los riegos pendientes
export const getIrrigationsRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/irrigations`);
    return response;
  } catch (error) {
    console.error("Error al obtener los riegos:", error);
    throw error;
  }
};

// Función para obtener un riego específico
export const getIrrigationRequest = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/irrigations/${id}`);
    return response;
  } catch (error) {
    console.error("Error al obtener el riego:", error);
    throw error;
  }
};

// Función para aprobar un riego (cambiar estado a 1)
export const approveIrrigationRequest = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/irrigations/${id}/approve`);
    return response;
  } catch (error) {
    console.error("Error al aprobar el riego:", error);
    throw error;
  }
};

// Función para rechazar un riego (cambiar estado a 0)
export const rejectIrrigationRequest = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/irrigations/${id}/reject`);
    return response;
  } catch (error) {
    console.error("Error al rechazar el riego:", error);
    throw error;
  }
};

// Función para crear una solicitud de riego
export const createIrrigationRequest = async (irrigationData) => {
  try {
    const response = await axios.post(`${API_URL}/irrigations`, {
      userId: irrigationData.userId,
      treeId: irrigationData.treeId,
    });
    return response;
  } catch (error) {
    console.error("Error al crear riego:", error);
    throw error;
  }
};

// Función para obtener irrigation pendientes de asignación (status = 4) con ubicación
export const getPendingIrrigationsRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/irrigations/pending/map`);
    return response;
  } catch (error) {
    console.error("Error al obtener irrigation pendientes:", error);
    throw error;
  }
};

// Función para obtener irrigation asignado al regador (status = 3)
export const getAssignedIrrigationRequest = async (irrigatorId) => {
  try {
    const response = await axios.get(
      `${API_URL}/irrigations/assigned/${irrigatorId}`,
    );
    return response;
  } catch (error) {
    console.error("Error al obtener irrigation asignado:", error);
    throw error;
  }
};

// Función para obtener el historial de riego de un árbol (evidencia de fotos)
export const getTreeIrrigationEvidenceRequest = async (treeId) => {
  try {
    const response = await axios.get(`${API_URL}/irrigations/tree/${treeId}`);
    return response;
  } catch (error) {
    console.error("Error al obtener evidencia de riego:", error);
    throw error;
  }
};

// Función para asignar irrigation a regador
export const assignTreeToIrrigatorRequest = async (
  irrigationId,
  irrigatorId,
) => {
  try {
    const response = await axios.post(`${API_URL}/irrigations/assign`, {
      irrigationId: irrigationId,
      irrigatorId: irrigatorId,
    });
    return response;
  } catch (error) {
    console.error("Error al asignar irrigation:", error);
    throw error;
  }
};

// Función para confirmar riego con evidencia (regador)
export const confirmIrrigationRequest = async (id, formData) => {
  try {
    const response = await axios.put(
      `${API_URL}/irrigations/${id}/confirm`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response;
  } catch (error) {
    console.error("Error al confirmar riego:", error);
    throw error;
  }
};
