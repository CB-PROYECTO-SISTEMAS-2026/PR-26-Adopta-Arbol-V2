import axios from "axios";
import { API_URL } from "../config/api.config.js"; 

// Subir QR para un usuario
export const uploadQr = async (userId, file, expirationDate) => {
  const formData = new FormData();
  formData.append("qrFile", file);
  formData.append("expirationDate", expirationDate);
  formData.append("userId", String(userId)); // Asegurar que sea string

  console.log("FormData preparado - userId:", userId, "expirationDate:", expirationDate, "file:", file.name);

  return await axios.post(`${API_URL}/upload-qr`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Obtener redemptions pendientes
export const getPendingRedemptions = async () => {
  return await axios.get(`${API_URL}/pending`);
};

// Confirmar redemption
export const confirmRedemption = async (id, adminId) => {
  return await axios.put(`${API_URL}/confirm/${id}`, { adminId });
};

// Rechazar redemption
export const rejectRedemption = async (id, adminId) => {
  return await axios.put(`${API_URL}/reject/${id}`, { adminId });
};

// Obtener detalles de un redemption
export const getRedemptionDetails = async (id) => {
  return await axios.get(`${API_URL}/details/${id}`);
};

// Obtener QR del usuario
export const getUserQr = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/qrcode/${userId}`);
    return response;
  } catch (error) {
    console.error("Error al obtener QR del usuario:", error);
    throw error;
  }
};

// Obtener QR por ID específico
export const getQRCodeById = async (qrId) => {
  try {
    const response = await axios.get(`${API_URL}/qrcode-by-id/${qrId}`);
    return response;
  } catch (error) {
    console.error("Error al obtener QR por ID:", error);
    throw error;
  }
};

// Crear solicitud de compra
export const createPurchaseRequest = async (purchaseData) => {
  try {
    const response = await axios.post(`${API_URL}/purchase`, purchaseData);
    return response;
  } catch (error) {
    console.error("Error al crear solicitud de compra:", error);
    throw error;
  }
};

// Subir comprobante de compra
export const uploadPurchaseProof = async (purchaseId, file) => {
  try {
    const formData = new FormData();
    formData.append("proofFile", file);
    formData.append("purchaseId", purchaseId);

    const response = await axios.post(`${API_URL}/purchase-proof`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error al subir comprobante:", error);
    throw error;
  }
};

// Crear solicitud de redención del regador con QR
export const createIrrigatorRedemption = async (userId, amount, qrFile) => {
  try {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("amount", amount);
    formData.append("qrFile", qrFile);

    const response = await axios.post(`${API_URL}/irrigator-redemption`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error al crear redención:", error);
    throw error;
  }
};