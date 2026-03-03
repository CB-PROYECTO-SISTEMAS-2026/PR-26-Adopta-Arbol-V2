import express from "express";
import {
  getUserNotifications,
  getUnreadNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notification.controller.js";

const router = express.Router();

// Obtener todas las notificaciones de un usuario
router.get("/notifications/user/:userId", getUserNotifications);

// Obtener conteo de notificaciones no leídas
router.get("/notifications/user/:userId/unread", getUnreadNotifications);

// Marcar una notificación como leída
router.put("/notifications/:id/read", markAsRead);

// Marcar todas las notificaciones como leídas
router.put("/notifications/user/:userId/read-all", markAllAsRead);

// Eliminar una notificación
router.delete("/notifications/:id", deleteNotification);

// Eliminar todas las notificaciones de un usuario
router.delete("/notifications/user/:userId/all", deleteAllNotifications);

export default router;

