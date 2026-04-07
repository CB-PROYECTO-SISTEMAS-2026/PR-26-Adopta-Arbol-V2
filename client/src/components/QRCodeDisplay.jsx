import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  getFirstActiveQRCode,
  createPurchaseRequest,
  uploadPurchaseProof,
} from "../api/redemption.api";
import { getStaticUrl, API_URL } from "../config/api.config.js";
import "./QRCodeDisplay.css";
import "./IrrigatorMap.css";
import "./TreeHome.css";

export default function QRCodeDisplay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedUser, logout } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } =
    useNotification();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const fileInputRef = useRef(null);

  // Obtener la información de la opción seleccionada del estado
  const locationOption = location.state?.selectedOption;
  const creditOptionId =
    location.state?.creditOptionId || location.state?.selectedOption?.id;
  const initialCredits = location.state?.credits || 5;
  const initialPrice = location.state?.price || 5;

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      // Obtener el primer QR activo (status = 1)
      const response = await getFirstActiveQRCode();

      setQrCode({
        id: response.data.id,
        imagePath: getStaticUrl(response.data.url),
        credits: initialCredits,
      });
    } catch (error) {
      console.error("Error al cargar QR code:", error);
      setError("No hay QR activo disponible en este momento");
      // Mostrar fallback visual, sin forzar un id inválido
      setQrCode({
        id: null,
        imagePath: "/qrcodes/1.png",
        credits: initialCredits,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm("¿Estás seguro de que deseas cerrar sesión?", () => {
      logout();
      navigate("/login");
    });
  };

  const handleDownloadQR = () => {
    if (!qrCode?.imagePath) {
      showWarning("No hay QR code disponible para descargar");
      return;
    }

    try {
      // Crear un enlace temporal para descargar la imagen
      const link = document.createElement("a");
      link.href = qrCode.imagePath;
      link.download = `qr-code-${qrCode.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log("QR code descargado exitosamente");
      showSuccess("QR code descargado exitosamente");
    } catch (error) {
      console.error("Error al descargar QR:", error);
      showError("Error al descargar el QR code");
    }
  };

  const handleAttachProof = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Resetear el valor del input
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    console.log("=== INICIO handleFileChange ===");
    const file = event.target.files[0];
    console.log("Archivo seleccionado:", file);

    if (file) {
      // Validar tipo de archivo
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      console.log("Tipo de archivo:", file.type);
      console.log("Tamaño del archivo:", file.size);

      if (!allowedTypes.includes(file.type)) {
        console.log("ERROR: Tipo de archivo no válido");
        showWarning(
          "Por favor seleccione un archivo de imagen válido (JPG, PNG, GIF, WebP)",
        );
        // Resetear el input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log("ERROR: Archivo demasiado grande");
        showWarning("El archivo es demasiado grande. Máximo 5MB");
        // Resetear el input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      console.log("Archivo válido, procediendo a subir...");
      setSelectedFile(file);

      // Crear vista previa de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("ERROR: No se seleccionó archivo");
    }
  };

  const handleConfirm = async () => {
    // Validar que hay archivo seleccionado
    if (!selectedFile) {
      showWarning("Primero debe adjuntar su comprobante de pago");
      return;
    }

    try {
      setIsUploading(true);
      console.log("=== INICIO handleConfirm ===");

      if (!loggedUser?.id) {
        showError("Error: Usuario no autenticado. Por favor inicie sesión.");
        setIsUploading(false);
        return;
      }

      if (!qrCode?.id) {
        showError("No hay un QR activo disponible para procesar esta compra.");
        setIsUploading(false);
        return;
      }

      // 1. Crear la solicitud de compra
      console.log("Creando solicitud de compra...");
      const currentOption = locationOption;
      const tempPurchaseData = {
        userId: loggedUser.id,
        qrcodeId: qrCode.id,
        creditId: currentOption?.id || creditOptionId,
      };

      const purchaseResponse = await createPurchaseRequest(tempPurchaseData);
      const tempPurchaseId = purchaseResponse.data.id;
      console.log("Compra creada con ID:", tempPurchaseId);

      // 2. Subir el comprobante
      console.log("Subiendo comprobante...");
      await uploadPurchaseProof(tempPurchaseId, selectedFile);
      console.log("Comprobante subido exitosamente");

      showSuccess("Comprobante subido. Confirmando solicitud...");

      // 3. Confirmar la compra
      console.log("Confirmando compra...");
      const confirmResponse = await fetch(
        `${API_URL}/purchase/${tempPurchaseId}/confirm`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (confirmResponse.ok) {
        console.log("Solicitud confirmada exitosamente");
        showSuccess(
          "¡Solicitud confirmada! El administrador revisará tu comprobante.",
        );

        // Limpiar estados
        setSelectedFile(null);
        setFilePreview(null);
        setPurchaseId(tempPurchaseId);

        // Redirigir al paso 3 de revisión
        navigate("/purchase-review", {
          state: {
            purchaseId: tempPurchaseId,
            credits: initialCredits,
            price: initialPrice,
          },
        });
      } else {
        throw new Error("Error al confirmar la solicitud");
      }

      console.log("=== ÉXITO handleConfirm ===");
    } catch (error) {
      console.error("=== ERROR handleConfirm ===");
      console.error("Error:", error);
      showError(
        error.response?.data?.message ||
          error.message ||
          "Error al procesar la solicitud",
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="treehome-container">
        <div className="loading-message">Cargando código QR...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="treehome-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="treehome-container">
      {/* Navbar igual a TreeHome */}
      <nav className="map-navbar">
        <div className="navbar-container">
          <button className="btn-back-map" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="navbar-center">
            <span className="navbar-greeting">
              BIENVENIDO {loggedUser?.name || loggedUser?.username || "Usuario"}
            </span>
          </div>

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

        {/* Menú desplegable */}
        {showNavMenu && (
          <div className="navbar-menu">
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/tree-home");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-map-fill"></i>
              <span>Mapa de Árboles</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/my-trees");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-tree-fill"></i>
              <span>Mis Árboles</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/ranking");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking</span>
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="qr-display-main">
        <div className="qr-display-content bg-white rounded">
          {/* Input de archivo oculto */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          {/* Title */}
          <h2 className="qr-display-title">
            Escaneé el Código Qr o Descárguelo y adjunte el comprobante
          </h2>

          {/* Step Indicator */}
          <div className="steps-indicator">
            <div className="step">
              <span>1</span>
            </div>
            <div className="step active">
              <span>2</span>
            </div>
            <div className="step">
              <span>3</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div>
            <div className="p-1 bg-white rounded">
              <img
                src={qrCode?.imagePath || "/qrcodes/1.png"}
                alt="Código QR"
                className="qr-code-image"
                onError={(e) => {
                  console.error("Error al cargar imagen QR:", e.target.src);
                  e.target.src = "/qrcodes/1.png";
                }}
              />
            </div>

            {/* Credits Display */}
            <div className="qr-credits mt-3 fw-bold">
              <h4 className="credits-amount">{initialCredits} Créditos</h4>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="qr-action-buttons">
            <button
              className="btn-qr-action btn-download"
              onClick={handleDownloadQR}
              disabled={isUploading}
            >
              Descargar Qr
            </button>
            <button
              className={`btn-qr-action btn-attach ${selectedFile ? "btn-success" : ""}`}
              onClick={handleAttachProof}
              disabled={isUploading}
            >
              {selectedFile ? "Comprobante adjuntado" : "Adjuntar Comprobante"}
            </button>
          </div>

          {/* Attached File Display */}
          {filePreview && (
            <div className="proof-preview-container">
              <img
                src={filePreview}
                alt="Vista previa del comprobante"
                className="proof-preview-image"
              />
            </div>
          )}

          {/* Confirm Button */}
          <button
            className={`btn-confirm-purchase ${!selectedFile || isUploading ? "btn-disabled" : ""}`}
            onClick={handleConfirm}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Procesando..." : "Confirmar"}
          </button>
        </div>
      </main>
    </div>
  );
}
