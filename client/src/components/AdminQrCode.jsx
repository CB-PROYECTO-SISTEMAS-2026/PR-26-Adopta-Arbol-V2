import { useEffect, useState } from "react";
import "./AdminQrCode.css";
import ViewDetailsModal from "./ViewDetailsModal.jsx";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  getPendingRedemptions,
  confirmRedemption,
  rejectRedemption,
  getRedemptionDetails,
  uploadQr,
  getQRCodeById,
  getAllQRCodes,
  updateQRCodeStatus,
} from "../api/redemption.api.js";
import { getUserByIdRequest } from "../api/user.api.js";
import { getStaticUrl } from "../config/api.config.js";

export default function RedemptionAdmin() {
  const { loggedUser } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } =
    useNotification();
  const [redemptions, setRedemptions] = useState([]);
  const [allQRCodes, setAllQRCodes] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [isQRDetailsModalOpen, setIsQRDetailsModalOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [expiryDate, setExpiryDate] = useState(""); // fecha de vencimiento
  const [searchTerm, setSearchTerm] = useState("");
  const [qrTypeFilter, setQrTypeFilter] = useState("cobro");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [qr5Notification, setQr5Notification] = useState(null); // Estado para notificación permanente del QR 5

  const fetchRedemptions = async () => {
    try {
      const res = await getPendingRedemptions();
      console.log("📊 Redemptions recibidos:", res.data);
      console.log("📊 Cantidad de redemptions:", res.data?.length || 0);
      setRedemptions(res.data);
    } catch (error) {
      console.error("Error fetching redemptions:", error);
    }
  };

  const fetchAllQRCodes = async () => {
    try {
      const res = await getAllQRCodes();
      console.log("📊 Todos los QR codes recibidos:", res.data);
      console.log("📊 Cantidad de QR codes:", res.data?.length || 0);
      setAllQRCodes(res.data);
    } catch (error) {
      console.error("Error fetching QR codes:", error);
    }
  };

  // Función para verificar fechas de vencimiento - Solo para QR con id 5 desde tabla qrcode
  const checkQr5Expiration = async () => {
    console.log(
      "🔍 Iniciando verificación de fecha de vencimiento para QR 5 desde tabla qrcode...",
    );

    try {
      // Obtener red de redemptions y escoger un QR dinámico en lugar del id fijo 5
      let qr5 = null;
      try {
        const pendingRes = await getPendingRedemptions();
        const pending = pendingRes.data || [];
        const firstWithQr = pending.find((p) => p.qrCodeId);
        if (firstWithQr) {
          try {
            const qrResponse = await getQRCodeById(firstWithQr.qrCodeId);
            qr5 = qrResponse.data;
          } catch (err) {
            console.warn(
              "No se pudo obtener QR por id desde pending:",
              firstWithQr.qrCodeId,
              err.message,
            );
          }
        } else {
          console.log(
            "No hay redemptions con qrCodeId para verificar expiración",
          );
        }
      } catch (err) {
        console.warn(
          "Error al obtener redemptions para determinar QR dinámico:",
          err.message,
        );
      }

      console.log("✅ QR encontrado en tabla qrcode:", qr5);

      if (!qr5) {
        console.log("⚠️ No se encontró QR con ID 5 en la tabla qrcode");
        setQr5Notification(null);
        return;
      }

      if (!qr5.expirationDate) {
        console.log("⚠️ El QR 5 no tiene fecha de vencimiento");
        setQr5Notification(null);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
      console.log("📅 Fecha de hoy:", today.toISOString().split("T")[0]);

      const expirationDate = new Date(qr5.expirationDate);

      // Validar que la fecha sea válida
      if (isNaN(expirationDate.getTime())) {
        console.log("⚠️ Fecha inválida para QR 5:", qr5.expirationDate);
        setQr5Notification(null);
        return;
      }

      expirationDate.setHours(0, 0, 0, 0);

      const daysUntilExpiry = Math.ceil(
        (expirationDate - today) / (1000 * 60 * 60 * 24),
      );

      // Obtener información del usuario si el QR tiene userId
      let userName = "Usuario desconocido";
      if (qr5.userId) {
        try {
          const userResponse = await getUserByIdRequest(qr5.userId);
          const user = userResponse.data;
          userName = `${user.name} ${user.lastName}`;
          console.log("👤 Usuario asociado al QR 5:", userName);
        } catch (error) {
          console.error("⚠️ Error al obtener usuario:", error);
        }
      }

      console.log(
        `📅 QR #5 - ${userName}: Días hasta expiración: ${daysUntilExpiry}`,
      );

      // Guardar información en el estado para mostrar notificación permanente
      if (daysUntilExpiry < 0) {
        // Ya expirado
        setQr5Notification({
          name: userName,
          days: Math.abs(daysUntilExpiry),
          type: "expired",
          message: `⚠️ QR #5 de ${userName} está expirado hace ${Math.abs(daysUntilExpiry)} día${Math.abs(daysUntilExpiry) !== 1 ? "s" : ""}`,
        });
      } else if (daysUntilExpiry <= 30) {
        // Próximo a vencer
        let type = "info";
        let emoji = "🟠";

        if (daysUntilExpiry <= 7) {
          type = "critical";
          emoji = "🔴";
        } else if (daysUntilExpiry <= 15) {
          type = "warning";
          emoji = "🟡";
        }

        setQr5Notification({
          name: userName,
          days: daysUntilExpiry,
          type: type,
          message: `${emoji} QR  expira en ${daysUntilExpiry} día${daysUntilExpiry !== 1 ? "s" : ""}`,
        });
      } else {
        // Más de 30 días, no mostrar notificación
        setQr5Notification(null);
      }
    } catch (error) {
      console.error("⚠️ Error al verificar QR 5:", error);
      // Si el QR no existe o hay error, no mostrar notificación
      setQr5Notification(null);
    }
  };

  useEffect(() => {
    fetchRedemptions();
    fetchAllQRCodes();
    checkQr5Expiration();
  }, []);

  const handleConfirm = async (id) => {
    const redemption = redemptions.find((r) => r.id === id);
    const redemptionInfo = redemption
      ? `${redemption.name} ${redemption.lastName}`
      : "esta redención";

    showConfirm(
      `¿Estás seguro de que deseas confirmar la redención de ${redemptionInfo}?`,
      async () => {
        try {
          await confirmRedemption(id);
          showSuccess("Redención confirmada exitosamente");
          await fetchRedemptions();
          await checkQr5Expiration();
        } catch (error) {
          console.error("Error al confirmar:", error);
          showError("Error al confirmar la redención. Inténtalo nuevamente.");
        }
      },
    );
  };

  const handleReject = async (id) => {
    const redemption = redemptions.find((r) => r.id === id);
    const redemptionInfo = redemption
      ? `${redemption.name} ${redemption.lastName}`
      : "esta redención";

    showConfirm(
      `¿Estás seguro de que deseas rechazar la redención de ${redemptionInfo}?`,
      async () => {
        try {
          await rejectRedemption(id, loggedUser?.id);
          showSuccess("Redención rechazada exitosamente");
          await fetchRedemptions();
          await checkQr5Expiration();
        } catch (error) {
          console.error("Error al rechazar:", error);
          showError("Error al rechazar la redención. Inténtalo nuevamente.");
        }
      },
    );
  };

  // Función para ver los detalles del redemption
  const handleViewRedemptionDetails = async (id) => {
    const res = await getRedemptionDetails(id);
    setSelectedRedemption(res.data);
    setIsDetailsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRedemption(null);
  };

  // Función para ver los detalles del QR code
  const handleViewQRCodeDetails = (qr) => {
    setSelectedQRCode(qr);
    setIsQRDetailsModalOpen(true);
  };

  // Función para cerrar el modal de detalles del QR code
  const closeQRDetailsModal = () => {
    setIsQRDetailsModalOpen(false);
    setSelectedQRCode(null);
  };

  // Función para dar de baja un QR code (cambiar estado a 2)
  const handleDeactivateQRCode = async (qrId) => {
    const qr = allQRCodes.find((q) => q.id === qrId);
    const qrInfo = qr ? `QR #${qr.id}` : "este QR code";

    showConfirm(
      `¿Estás seguro de que deseas dar de baja ${qrInfo}?`,
      async () => {
        try {
          await updateQRCodeStatus(qrId, 0);
          showSuccess("QR code dado de baja exitosamente");
          await fetchAllQRCodes();
          closeQRDetailsModal();
        } catch (error) {
          console.error("Error al dar de baja QR code:", error);
          showError("Error al dar de baja el QR code. Inténtalo nuevamente.");
        }
      },
    );
  };

  const handleUploadQr = async (e) => {
    e.preventDefault();
    if (!qrFile || !expiryDate) {
      showWarning("Selecciona fecha y archivo QR");
      return;
    }
    if (!loggedUser?.id) {
      showError("Debes estar logueado para subir QR");
      return;
    }

    try {
      // Verificar que el archivo sea válido
      if (!qrFile.type.startsWith("image/")) {
        showError("El archivo debe ser una imagen (JPG, PNG, GIF)");
        return;
      }

      // Verificar tamaño del archivo (máximo 5MB)
      if (qrFile.size > 5 * 1024 * 1024) {
        showError("El archivo es demasiado grande. Máximo 5MB");
        return;
      }

      // Validar que la fecha no esté vacía
      if (!expiryDate || expiryDate.trim() === "") {
        showError("Por favor selecciona una fecha de vencimiento");
        return;
      }

      // Limpiar el nombre del archivo si tiene espacios u otros caracteres problemáticos
      const cleanFileName = qrFile.name
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9.-]/g, "");
      const cleanedFile =
        cleanFileName !== qrFile.name
          ? new File([qrFile], cleanFileName, { type: qrFile.type })
          : qrFile;

      console.log(
        "Enviando QR - userId:",
        loggedUser.id,
        "expiryDate:",
        expiryDate,
        "file:",
        cleanedFile.name,
      );
      await uploadQr(loggedUser.id, cleanedFile, expiryDate); // Usar el ID del usuario logueado
      showSuccess("QR subido correctamente");
      setQrFile(null);
      setExpiryDate("");
      setShowUploadModal(false);
      await fetchRedemptions();
      await checkQr5Expiration();
    } catch (error) {
      console.error("Error uploading QR:", error);
      console.error("Error response:", error.response);
      console.error("Error response data:", error.response?.data);

      // Obtener el mensaje de error más específico
      let errorMessage = "Error desconocido al subir QR";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      showError(`Error al subir QR: ${errorMessage}`);
    }
  };

  const filteredRedemptions = redemptions.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lastName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredQRCodes = allQRCodes.filter(
    (qr) => (qr.type || "").toLowerCase() === qrTypeFilter,
  );

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredRedemptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRedemptions = filteredRedemptions.slice(startIndex, endIndex);

  // Funciones de paginación
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generar números de página para mostrar
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }

    return pages;
  };

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Redemptions</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      {/* Notificación persistente del QR 5 */}
      {qr5Notification && (
        <div
          className={`qr5-notification-banner qr5-notification-${qr5Notification.type}`}
        >
          <div className="qr5-notification-content">
            <i
              className={`bi ${qr5Notification.type === "expired" || qr5Notification.type === "critical" ? "bi-exclamation-triangle-fill" : qr5Notification.type === "warning" ? "bi-exclamation-circle-fill" : "bi-info-circle-fill"}`}
            ></i>
            <span className="qr5-notification-message">
              {qr5Notification.message}
            </span>
          </div>
          <button
            className="qr5-notification-close"
            onClick={() => setQr5Notification(null)}
            title="Cerrar notificación"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>
      )}

      {/* Botón Añadir QR */}
      <div className="filters-section">
        <div
          className="qr-type-filters"
          role="radiogroup"
          aria-label="Filtrar por tipo de QR"
        >
          <label className="qr-type-radio">
            <input
              type="radio"
              name="qrTypeFilter"
              value="cobro"
              checked={qrTypeFilter === "cobro"}
              onChange={(e) => setQrTypeFilter(e.target.value)}
            />
            <span>Cobro</span>
          </label>

          <label className="qr-type-radio">
            <input
              type="radio"
              name="qrTypeFilter"
              value="retiro"
              checked={qrTypeFilter === "retiro"}
              onChange={(e) => setQrTypeFilter(e.target.value)}
            />
            <span>Retiro</span>
          </label>
        </div>

        <button
          className="add-user-btn"
          onClick={() => setShowUploadModal(true)}
        >
          Añadir QR
        </button>
      </div>

      {/* Sección: Todos los Códigos QR */}
      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Estado</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredQRCodes && filteredQRCodes.length > 0 ? (
              filteredQRCodes.map((qr) => (
                <tr key={qr.id}>
                  <td>
                    {qr.url ? (
                      <img
                        src={getStaticUrl(qr.url)}
                        alt={`QR ${qr.id}`}
                        style={{ width: 60, height: "auto", borderRadius: 4 }}
                      />
                    ) : (
                      <i className="bi bi-qr-code avatar-placeholder"></i>
                    )}
                  </td>
                  <td>
                    <span
                      className={`payment-status ${
                        qr.status === 1 ? "status-active" : "status-inactive"
                      }`}
                    >
                      {qr.status === 1 ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td>{new Date(qr.registerDate).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleViewQRCodeDetails(qr)}
                      title="Ver detalles"
                    >
                      <i className="bi bi-eye-fill"></i>
                    </button>
                    {qr.status !== 0 &&
                      (qr.type || "").toLowerCase() !== "retiro" && (
                        <button
                          className="action-btn reject-btn"
                          onClick={() => handleDeactivateQRCode(qr.id)}
                          title="Dar de baja"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#999",
                  }}
                >
                  <i
                    className="bi bi-inbox"
                    style={{ fontSize: "24px", marginRight: "10px" }}
                  ></i>
                  No hay códigos QR de tipo {qrTypeFilter} registrados aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {/* Modal para ver detalles del QR code */}
      <ViewDetailsModal
        isOpen={isQRDetailsModalOpen}
        onClose={closeQRDetailsModal}
        data={selectedQRCode}
        type="qrcode"
        onDeactivate={handleDeactivateQRCode}
      />

      {/* Modal Subir QR */}
      {showUploadModal && (
        <div
          className="qr-modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="qr-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="qr-modal-header">
              <div className="qr-modal-icon">
                <i className="bi bi-qr-code-scan"></i>
              </div>
              <button
                className="qr-modal-close"
                onClick={() => setShowUploadModal(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="qr-modal-body">
              <h2 className="qr-modal-title">Subir Nuevo Código QR</h2>
              <form onSubmit={handleUploadQr} className="qr-upload-form">
                {/* Campo de fecha */}
                <div className="qr-form-group">
                  <label className="qr-form-label">
                    <i className="bi bi-calendar-event"></i>
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    className="qr-form-input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>

                {/* Campo de archivo */}
                <div className="qr-form-group">
                  <label className="qr-form-label">
                    <i className="bi bi-image"></i>
                    Seleccionar Imagen QR
                  </label>
                  <div className="qr-file-upload">
                    <input
                      type="file"
                      id="qrFileInput"
                      accept="image/*"
                      onChange={(e) => setQrFile(e.target.files[0])}
                      className="qr-file-input"
                      required
                    />
                    <label htmlFor="qrFileInput" className="qr-file-label">
                      <div className="qr-file-icon">
                        <i className="bi bi-cloud-upload"></i>
                      </div>
                      <div className="qr-file-text">
                        <span className="qr-file-title">
                          {qrFile ? qrFile.name : "Haz clic para seleccionar"}
                        </span>
                        <span className="qr-file-subtitle">
                          PNG, JPG, JPEG hasta 5MB
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Preview de la imagen */}
                {qrFile && (
                  <div className="qr-preview">
                    <div className="qr-preview-label">
                      <i className="bi bi-eye"></i>
                      Vista Previa
                    </div>
                    <div className="qr-preview-image">
                      <img
                        src={URL.createObjectURL(qrFile)}
                        alt="Preview QR"
                        className="qr-preview-img"
                      />
                    </div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="qr-modal-actions">
                  <button
                    type="button"
                    className="qr-btn-cancel"
                    onClick={() => setShowUploadModal(false)}
                  >
                    <i className="bi bi-x-circle"></i>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="qr-btn-upload"
                    disabled={!qrFile || !expiryDate}
                  >
                    <i className="bi bi-upload"></i>
                    Subir QR
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
