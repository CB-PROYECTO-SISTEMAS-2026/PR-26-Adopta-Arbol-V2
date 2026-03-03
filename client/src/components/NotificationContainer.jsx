import { useNotification } from "../context/NotificationContext.jsx";
import "./NotificationContainer.css";

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return "bi-check-circle-fill";
      case "error":
        return "bi-x-circle-fill";
      case "warning":
        return "bi-exclamation-triangle-fill";
      default:
        return "bi-info-circle-fill";
    }
  };

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`notification notification-${notification.type}`}
        >
          <div className="notification-content">
            <i className={`bi ${getIcon(notification.type)} notification-icon`}></i>
            <span className="notification-message">{notification.message}</span>
          </div>
          <button
            className="notification-close"
            onClick={() => removeNotification(notification.id)}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;

