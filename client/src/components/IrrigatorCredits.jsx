import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./IrrigatorCredits.css";
import "./IrrigatorMap.css"; // reutilizar estilos del navbar y responsive
import { useUsers } from "../context/UserContext.jsx";
import { createIrrigatorRedemption } from "../api/redemption.api.js";
import { getUnreadNotificationsRequest } from "../api/notification.api";
import NotificationsPanel from "./NotificationsPanel";

export default function IrrigatorCredits() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const fileInputRef = useRef(null);

  const [showNavMenu, setShowNavMenu] = useState(false);

  const [amount, setAmount] = useState("");
  const [qrImage, setQrImage] = useState(null);
  const [qrImagePreview, setQrImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showLogoutCard, setShowLogoutCard] = useState(false);

  useEffect(() => {
    loadUnreadNotifications();
  }, []);

  const loadUnreadNotifications = async () => {
    if (!loggedUser?.id) return;

    try {
      const response = await getUnreadNotificationsRequest(loggedUser.id);
      setUnreadNotificationsCount(response.count || 0);
    } catch (error) {
      console.error("Error al cargar notificaciones no leídas:", error);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith("image/")) {
        alert("Por favor selecciona un archivo de imagen válido");
        return;
      }

      setQrImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!qrImage) {
      alert("Por favor, sube una imagen del QR");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert("Por favor, ingresa una cantidad válida");
      return;
    }

    if (!loggedUser?.id) {
      alert("Error: No se encontró el usuario");
      return;
    }

    try {
      setSubmitting(true);

      // Enviar al backend
      const response = await createIrrigatorRedemption(
        loggedUser.id,
        amount,
        qrImage
      );

      console.log("Respuesta del servidor:", response.data);

      alert(
        "¡Solicitud de redención creada exitosamente! Tu solicitud será procesada pronto."
      );

      // Limpiar formulario
      setAmount("");
      setQrImage(null);
      setQrImagePreview(null);

      // Volver al mapa
      navigate("/regador/map");
    } catch (error) {
      console.error("Error al crear redención:", error);
      alert(
        `Error al crear la solicitud: ${
          error.response?.data?.message || error.message
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="irrigator-redemption-container">
      {/* Navbar (reutiliza estructura de IrrigatorMap) */}
      <nav className="map-navbar">
        <div className="navbar-container">
          <button className="btn-back-map" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="navbar-actions">
            <button
              className="btn-hamburger"
              onClick={() => setShowNavMenu(!showNavMenu)}
              aria-label="Menú"
            >
              <i className={showNavMenu ? "bi bi-x-lg" : "bi bi-list"}></i>
            </button>

            <div className="user-icon-container">
              <div
                className="user-icon"
                onClick={() => setShowLogoutCard(!showLogoutCard)}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-person-fill"></i>
              </div>

              {showLogoutCard && (
                <div className="logout-card">
                  <div className="logout-card-info">
                    <div className="navbar-points">
                      <span className="points-icon">⭐</span>
                      <span className="points-amount">
                        {loggedUser?.point || 0}
                      </span>
                    </div>
                    <div className="navbar-credits">
                      <i className="bi bi-currency-dollar"></i>
                      <span>{loggedUser?.credits || 0}</span>
                    </div>
                  </div>
                  <button className="logout-card-button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNavMenu && (
          <div className="navbar-menu">
            <button
              className="navbar-menu-item"
              onClick={() => {
                setShowNotificationsPanel(true);
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-bell-fill"></i>
              <span>Notificaciones</span>
              {unreadNotificationsCount > 0 && (
                <span className="menu-badge">{unreadNotificationsCount}</span>
              )}
            </button>

            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/regador/ranking");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking</span>
            </button>

            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/regador/credits");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-currency-dollar"></i>
              <span>Retirar</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="redemption-content">
        <h1 className="redemption-title">Subir Qr</h1>

        {/* QR Upload Area */}
        <div className="qr-upload-area" onClick={handleImageClick}>
          {qrImagePreview ? (
            <img
              src={qrImagePreview}
              alt="QR Preview"
              className="qr-preview-image"
            />
          ) : (
            <div className="qr-placeholder">
              <i className="bi bi-image placeholder-icon"></i>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <button className="btn-upload-image" onClick={handleImageClick}>
          Subir Imagen
        </button>

        {/* Amount Input */}
        <div className="amount-section">
          <label className="amount-label">
            Ingresar la cantidad que desea retirar:
          </label>
          <input
            type="number"
            className="amount-input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            max={loggedUser?.credits || 0}
          />
        </div>

        {/* Confirm Button */}
        <button
          className="btn-confirm-redemption"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "PROCESANDO..." : "CONFIRMAR"}
        </button>
      </div>

      {/* Panel de Notificaciones */}
      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => {
          setShowNotificationsPanel(false);
          loadUnreadNotifications();
        }}
      />
    </div>
  );
}
