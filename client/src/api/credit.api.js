import axios from "axios";
import { API_URL } from "../config/api.config.js"; 

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
