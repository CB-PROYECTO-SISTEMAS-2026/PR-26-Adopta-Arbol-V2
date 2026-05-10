import axios from "axios";
import { API_URL } from "../config/api.config.js";

// ========================================
// FUNCIONES PARA OPCIONES DE CRÉDITO
// ========================================

// Obtener todas las opciones de crédito activas
export const getAllCreditOptions = async () => {
  return await axios.get(`${API_URL}/credit-options`);
};

// Obtener las 5 opciones de crédito más compradas
export const getTopCreditOptions = async () => {
  return await axios.get(`${API_URL}/credit-options/stats/top`);
};

// Obtener todas las opciones de crédito para administración (incluye status 0 y 1)
export const getAllCreditOptionsAdmin = async () => {
  return await axios.get(`${API_URL}/credit-options/admin`);
};

// Obtener opción de crédito específica
export const getCreditOptionById = async (id) => {
  return await axios.get(`${API_URL}/credit-options/${id}`);
};

// Crear opción de crédito (Admin)
export const createCreditOption = async (creditData, userId) => {
  return await axios.post(`${API_URL}/credit-options`, {
    ...creditData,
    userId,
  });
};

// Actualizar opción de crédito (Admin)
export const updateCreditOption = async (id, creditData, userId) => {
  return await axios.put(`${API_URL}/credit-options/${id}`, {
    ...creditData,
    userId,
  });
};

// Eliminar opción de crédito (Admin)
export const deleteCreditOption = async (id, userId) => {
  return await axios.delete(`${API_URL}/credit-options/${id}`, {
    data: { userId },
  });
};

// ========================================
// FUNCIONES PARA COMPRAS
// ========================================

// Obtener todas las compras
export const getAllPurchases = async () => {
  return await axios.get(`${API_URL}/purchases`);
};

// Obtener compras pendientes
export const getPendingPurchases = async () => {
  return await axios.get(`${API_URL}/purchases/pending`);
};

// Aprobar compra
export const approvePurchase = async (id, adminId) => {
  return await axios.put(`${API_URL}/purchases/approve/${id}`, { adminId });
};

// Rechazar compra
export const rejectPurchase = async (id, adminId) => {
  return await axios.put(`${API_URL}/purchases/reject/${id}`, { adminId });
};

// Obtener detalles de una compra
export const getPurchaseDetails = async (id) => {
  return await axios.get(`${API_URL}/purchases/details/${id}`);
};
