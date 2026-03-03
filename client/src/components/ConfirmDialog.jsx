import { useNotification } from "../context/NotificationContext.jsx";
import "./ConfirmDialog.css";

const ConfirmDialog = () => {
  const { confirmDialog, closeConfirm } = useNotification();

  if (!confirmDialog) return null;

  return (
    <div className="confirm-overlay" onClick={closeConfirm}>
      <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-header">
          <i className="bi bi-exclamation-triangle-fill confirm-icon"></i>
          <h3 className="confirm-title">Confirmar Acción</h3>
        </div>
        <div className="confirm-body">
          <p className="confirm-message">{confirmDialog.message}</p>
        </div>
        <div className="confirm-actions">
          <button
            className="confirm-btn confirm-btn-cancel"
            onClick={confirmDialog.onCancel}
          >
            <i className="bi bi-x-lg"></i>
            Cancelar
          </button>
          <button
            className="confirm-btn confirm-btn-confirm"
            onClick={confirmDialog.onConfirm}
          >
            <i className="bi bi-check-lg"></i>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

