import { createContext, useContext, useState, useCallback } from "react";

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((message, type = "info") => {
    const id = Date.now() + Math.random();
    const notification = { id, message, type };
    
    setNotifications((prev) => [...prev, notification]);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
    
    return id;
  }, [removeNotification]);

  const showSuccess = useCallback((message) => {
    return showNotification(message, "success");
  }, [showNotification]);

  const showError = useCallback((message) => {
    return showNotification(message, "error");
  }, [showNotification]);

  const showWarning = useCallback((message) => {
    return showNotification(message, "warning");
  }, [showNotification]);

  const showInfo = useCallback((message) => {
    return showNotification(message, "info");
  }, [showNotification]);

  const showConfirm = useCallback((message, onConfirm, onCancel) => {
    setConfirmDialog({
      message,
      onConfirm: () => {
        if (onConfirm) onConfirm();
        setConfirmDialog(null);
      },
      onCancel: () => {
        if (onCancel) onCancel();
        setConfirmDialog(null);
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        removeNotification,
        showConfirm,
        confirmDialog,
        closeConfirm,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

