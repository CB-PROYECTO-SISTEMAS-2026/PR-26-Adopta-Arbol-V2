import React, { useState, useEffect } from "react";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext";
import {
  getUserNotificationsRequest,
  markNotificationAsReadRequest,
  markAllNotificationsAsReadRequest,
  deleteNotificationRequest,
  deleteAllNotificationsRequest,
} from "../api/notification.api";
import "./NotificationsPanel.css";

const NotificationsPanel = ({ isOpen, onClose }) => {
  const { loggedUser } = useUsers();
  const { showSuccess, showError } = useNotification();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all"); // 'all', 'unread', 'read'

  useEffect(() => {
    if (isOpen && loggedUser?.id) {
      loadNotifications();
    }
  }, [isOpen, loggedUser?.id]);

  const loadNotifications = async () => {
    if (!loggedUser?.id) return;
    
    setLoading(true);
    try {
      const data = await getUserNotificationsRequest(loggedUser.id);
      setNotifications(data || []);
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
      showError("Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsReadRequest(notificationId);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: 1, readAt: new Date() } : n
        )
      );
    } catch (error) {
      console.error("Error al marcar como leída:", error);
      showError("Error al marcar notificación como leída");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!loggedUser?.id) return;
    
    try {
      await markAllNotificationsAsReadRequest(loggedUser.id);
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: 1, readAt: new Date() }))
      );
      showSuccess("Todas las notificaciones marcadas como leídas");
    } catch (error) {
      console.error("Error al marcar todas como leídas:", error);
      showError("Error al marcar todas las notificaciones como leídas");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteNotificationRequest(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      showSuccess("Notificación eliminada");
    } catch (error) {
      console.error("Error al eliminar:", error);
      showError("Error al eliminar notificación");
    }
  };

  const handleDeleteAll = async () => {
    if (!loggedUser?.id) return;
    
    try {
      await deleteAllNotificationsRequest(loggedUser.id);
      setNotifications([]);
      showSuccess("Todas las notificaciones eliminadas");
    } catch (error) {
      console.error("Error al eliminar todas:", error);
      showError("Error al eliminar todas las notificaciones");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "adoption_approved":
        return "bi-check-circle-fill";
      case "adoption_rejected":
        return "bi-x-circle-fill";
      case "tree_irrigated":
        return "bi-droplet-fill";
      case "credits_purchased":
        return "bi-cash-stack";
      default:
        return "bi-bell-fill";
    }
  };

  const getNotificationTypeClass = (type) => {
    switch (type) {
      case "adoption_approved":
      case "credits_purchased":
      case "tree_irrigated":
        return "success";
      case "adoption_rejected":
        return "error";
      default:
        return "info";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMins = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMs / 3600000);
    const diffInDays = Math.floor(diffInMs / 86400000);

    if (diffInMins < 1) return "Ahora";
    if (diffInMins < 60) return `Hace ${diffInMins} minuto${diffInMins > 1 ? "s" : ""}`;
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? "s" : ""}`;
    if (diffInDays < 7) return `Hace ${diffInDays} día${diffInDays > 1 ? "s" : ""}`;
    
    return date.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return n.isRead === 0;
    if (filter === "read") return n.isRead === 1;
    return true;
  });

  const unreadCount = notifications.filter((n) => n.isRead === 0).length;

  if (!isOpen) return null;

  return (
    <div className="notifications-panel-overlay" onClick={onClose}>
      <div className="notifications-panel" onClick={(e) => e.stopPropagation()}>
        <div className="notifications-panel-header">
          <h3>
            <i className="bi bi-bell-fill"></i>
            Notificaciones
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </h3>
          <button className="close-btn" onClick={onClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="notifications-panel-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todas
          </button>
          <button
            className={`filter-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            No leídas ({unreadCount})
          </button>
          <button
            className={`filter-btn ${filter === "read" ? "active" : ""}`}
            onClick={() => setFilter("read")}
          >
            Leídas
          </button>
        </div>

        <div className="notifications-panel-actions">
          {unreadCount > 0 && (
            <button className="notification-action-btn mark-all" onClick={handleMarkAllAsRead}>
              <i className="bi bi-check-all"></i>
              Marcar todas como leídas
            </button>
          )}
          {notifications.length > 0 && (
            <button className="notification-action-btn delete-all" onClick={handleDeleteAll}>
              <i className="bi bi-trash"></i>
              Eliminar todas
            </button>
          )}
        </div>

        <div className="notifications-panel-content">
          {loading ? (
            <div className="loading-notifications">
              <i className="bi bi-hourglass-split"></i>
              <p>Cargando notificaciones...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="no-notifications">
              <i className="bi bi-inbox"></i>
              <p>No hay notificaciones {filter === "unread" ? "no leídas" : ""}</p>
            </div>
          ) : (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead === 0 ? "unread" : ""} ${getNotificationTypeClass(notification.type)}`}
                >
                  <div className="notification-icon-container">
                    <i className={`bi ${getNotificationIcon(notification.type)}`}></i>
                  </div>
                  <div className="notification-content">
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {notification.isRead === 0 && (
                      <button
                        className="notification-icon-btn"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Marcar como leída"
                      >
                        <i className="bi bi-check2"></i>
                      </button>
                    )}
                    <button
                      className="notification-icon-btn delete"
                      onClick={() => handleDelete(notification.id)}
                      title="Eliminar"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPanel;

