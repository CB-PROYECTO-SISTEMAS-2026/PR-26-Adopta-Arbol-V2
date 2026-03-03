import axios from "axios";
import { API_URL } from "../config/api.config.js";

// Obtener todas las notificaciones de un usuario
export const getUserNotificationsRequest = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/notifications/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    throw error;
  }
};

// Obtener conteo de notificaciones no leídas
export const getUnreadNotificationsRequest = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/notifications/user/${userId}/unread`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener notificaciones no leídas:", error);
    throw error;
  }
};

// Marcar una notificación como leída
export const markNotificationAsReadRequest = async (notificationId) => {
  try {
    const response = await axios.put(`${API_URL}/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    throw error;
  }
};

// Marcar todas las notificaciones como leídas
export const markAllNotificationsAsReadRequest = async (userId) => {
  try {
    const response = await axios.put(`${API_URL}/notifications/user/${userId}/read-all`);
    return response.data;
  } catch (error) {
    console.error("Error al marcar todas las notificaciones como leídas:", error);
    throw error;
  }
};

// Eliminar una notificación
export const deleteNotificationRequest = async (notificationId) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar notificación:", error);
    throw error;
  }
};

// Eliminar todas las notificaciones
export const deleteAllNotificationsRequest = async (userId) => {
  try {
    const response = await axios.delete(`${API_URL}/notifications/user/${userId}/all`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar todas las notificaciones:", error);
    throw error;
  }
};

