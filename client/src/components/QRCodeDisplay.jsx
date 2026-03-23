import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  getQRCodeById,
  createPurchaseRequest,
  uploadPurchaseProof,
} from "../api/redemption.api";
import { getAllCreditOptions } from "../api/credit.api.js";
import { getStaticUrl, API_URL } from "../config/api.config.js";
import "./QRCodeDisplay.css";

export default function QRCodeDisplay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loggedUser } = useUsers();
  const { showSuccess, showError, showWarning } = useNotification();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [purchaseId, setPurchaseId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [creditOptions, setCreditOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const fileInputRef = useRef(null);

  // Obtener la información de la opción seleccionada del estado
  const locationOption = location.state?.selectedOption;
  const creditOptionId =
    location.state?.creditOptionId || location.state?.selectedOption?.id;
  const initialCredits = location.state?.credits || 5;
  const initialPrice = location.state?.price || 5;

  useEffect(() => {
    loadQRCode();
    loadCreditOptions();
  }, []);

  const loadCreditOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await getAllCreditOptions();
      console.log("Opciones de crédito:", response.data);
      setCreditOptions(response.data || []);

      // Establecer la opción seleccionada inicialmente
      if (locationOption && response.data.length > 0) {
        const foundOption = response.data.find(
          (opt) => opt.id === locationOption.id,
        );
        if (foundOption) {
          setSelectedOption(foundOption);
        }
      }
    } catch (error) {
      console.error("Error cargando opciones de crédito:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadQRCode = async () => {
    try {
      setLoading(true);
      // Obtener QR code con ID 1 de la base de datos
      const response = await getQRCodeById(1);
      const creditsAmount = selectedOption
        ? parseFloat(selectedOption.purchased) +
          parseFloat(selectedOption.bonus)
        : initialCredits;

      setQrCode({
        id: response.data.id,
        imagePath: getStaticUrl(response.data.url),
        credits: creditsAmount,
      });
    } catch (error) {
      console.error("Error al cargar QR code:", error);
      setError("Error al cargar el código QR");
      // Fallback a imagen local si hay error
      const creditsAmount = selectedOption
        ? parseFloat(selectedOption.purchased) +
          parseFloat(selectedOption.bonus)
        : initialCredits;

      setQrCode({
        id: 1,
        imagePath: "/qrcodes/1.png",
        credits: creditsAmount,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCreditOption = (option) => {
    setSelectedOption(option);
    console.log("Opción de crédito seleccionada:", option);
    // Actualizar el QR code con los nuevos créditos
    const creditsAmount =
      parseFloat(option.purchased) + parseFloat(option.bonus);
    setQrCode((prev) => ({
      ...prev,
      credits: creditsAmount,
    }));
  };

  const handleBack = () => {
    navigate("/user-buy-credits");
  };

  const handleRanking = () => {
    navigate("/ranking");
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

      // 1. Crear la solicitud de compra
      console.log("Creando solicitud de compra...");
      const currentOption = selectedOption || locationOption;
      const tempPurchaseData = {
        userId: loggedUser.id,
        qrcodeId: qrCode?.id || 1,
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

        // Redirigir después de 2 segundos
        setTimeout(() => {
          navigate("/tree-home");
        }, 2000);
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
      <div className="qrcode-display-container">
        <div className="loading">Cargando código QR...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qrcode-display-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="qrcode-display-container">
      {/* Input de archivo oculto */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Header */}
      <header className="qrcode-display-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">←</span>
        </button>
        <div className="user-info">
          <span className="username">
            🍃 {loggedUser?.username || "Usuario"}
          </span>
          <div className="credits-display">
            <span className="credits-icon">💰</span>
            <span className="credits-amount">{loggedUser?.credits || 0}</span>
          </div>
        </div>
        <button className="btn-ranking" onClick={handleRanking}>
          Ranking
        </button>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* QR Code Section */}
        <div className="qr-section">
          <div className="qr-code-container">
            <div className="qr-frame">
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
          </div>

          {/* Credits Display and Options */}
          <div className="credits-section">
            <div className="credits-display">
              <div className="credits-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm2.5-10.5l-1.5 1.5c-.32-.4-.74-.75-1.24-1.01C13.5 6.5 12.8 6 12 6s-1.5.5-1.76 1.49c-.5.26-.92.61-1.24 1.01L7.5 6.5C8.5 5.5 10.2 5 12 5s3.5.5 4.5 1.5z" />
                </svg>
              </div>
              <div className="credits-info">
                <span className="credits-text">
                  CREDITOS:{" "}
                  {selectedOption
                    ? (
                        parseFloat(selectedOption.purchased) +
                        parseFloat(selectedOption.bonus)
                      ).toFixed(0)
                    : initialCredits}
                </span>
                <span className="price-text">
                  PRECIO:{" "}
                  {selectedOption
                    ? parseFloat(selectedOption.price).toFixed(2)
                    : initialPrice}{" "}
                  Bs
                </span>
              </div>
            </div>

            {/* Credit Options */}
            {creditOptions.length > 0 && (
              <div className="credit-options-selector">
                <label className="options-label">
                  Selecciona una opción de créditos:
                </label>
                <div className="credit-options-grid">
                  {creditOptions.map((option) => {
                    const totalCredits =
                      parseFloat(option.purchased) + parseFloat(option.bonus);
                    const isSelected = selectedOption?.id === option.id;

                    return (
                      <button
                        key={option.id}
                        className={`credit-option-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectCreditOption(option)}
                      >
                        <div className="option-credits">
                          {totalCredits.toFixed(0)}
                        </div>
                        <div className="option-price">
                          {parseFloat(option.price).toFixed(2)} Bs
                        </div>
                        {option.bonus > 0 && (
                          <div className="option-bonus">
                            +{parseFloat(option.bonus).toFixed(0)} bonus
                          </div>
                        )}
                        {isSelected && (
                          <div className="option-indicator">✓</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vista previa del comprobante */}
        {filePreview && (
          <div className="proof-preview-container">
            <label className="proof-preview-label">
              Comprobante de pago adjuntado:
            </label>
            <img
              src={filePreview}
              alt="Vista previa del comprobante"
              className="proof-preview-image"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            className="btn-download"
            onClick={handleDownloadQR}
            disabled={isUploading}
          >
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            Descargar QR
          </button>
          <button
            className={`btn-attach ${selectedFile ? "btn-success" : ""} ${isUploading ? "btn-loading" : ""}`}
            onClick={handleAttachProof}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <svg
                  className="btn-icon spinner"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Cargando...
              </>
            ) : selectedFile ? (
              <>
                <svg
                  className="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                </svg>
                Comprobante adjuntado
              </>
            ) : (
              <>
                <svg
                  className="btn-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49" />
                </svg>
                Adjuntar comprobante
              </>
            )}
          </button>
          <button
            className={`btn-confirm ${!selectedFile ? "btn-disabled" : ""}`}
            onClick={handleConfirm}
            disabled={!selectedFile || isUploading}
          >
            <svg
              className="btn-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            {isUploading ? "Procesando..." : "Confirmar y enviar"}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="qrcode-display-footer">
        <div className="footer-content">
          <span className="copyright">
            Copyright © 2020. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
