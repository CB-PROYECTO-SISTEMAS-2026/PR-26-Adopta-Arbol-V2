import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import { getQRCodeById, createPurchaseRequest, uploadPurchaseProof } from "../api/redemption.api";
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
  const [purchaseId, setPurchaseId] = useState(null);
  const fileInputRef = useRef(null);
  
  // Obtener la información de la opción seleccionada
  const selectedOption = location.state?.selectedOption;
  const selectedCredits = location.state?.credits || 5;
  const selectedPrice = location.state?.price || 5;

  useEffect(() => {
    loadQRCode();
  }, []);

  const loadQRCode = async () => {
    try {
      setLoading(true);
      // Obtener QR code con ID 1 de la base de datos
      const response = await getQRCodeById(1);
      setQrCode({
        id: response.data.id,
        imagePath: getStaticUrl(response.data.url),
        credits: selectedCredits // Usar los créditos seleccionados
      });
    } catch (error) {
      console.error("Error al cargar QR code:", error);
      setError("Error al cargar el código QR");
      // Fallback a imagen local si hay error
      setQrCode({
        id: 1,
        imagePath: "/qrcodes/1.png",
        credits: selectedCredits // Usar los créditos seleccionados
      });
    } finally {
      setLoading(false);
    }
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
      const link = document.createElement('a');
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
    fileInputRef.current?.click();
  };

  const handleFileChange = (event) => {
    console.log("=== INICIO handleFileChange ===");
    const file = event.target.files[0];
    console.log("Archivo seleccionado:", file);
    
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      console.log("Tipo de archivo:", file.type);
      console.log("Tamaño del archivo:", file.size);
      
      if (!allowedTypes.includes(file.type)) {
        console.log("ERROR: Tipo de archivo no válido");
        showWarning("Por favor seleccione un archivo de imagen válido (JPG, PNG, GIF)");
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log("ERROR: Archivo demasiado grande");
        showWarning("El archivo es demasiado grande. Máximo 5MB");
        return;
      }

      console.log("Archivo válido, procediendo a subir...");
      setSelectedFile(file);
      uploadProofFile(file);
    } else {
      console.log("ERROR: No se seleccionó archivo");
    }
  };

  const uploadProofFile = async (file) => {
    try {
      console.log("=== INICIO uploadProofFile ===");
      console.log("Archivo:", file);
      console.log("Usuario:", loggedUser);
      console.log("QR Code:", qrCode);

      // Crear una solicitud temporal para subir el comprobante
      const tempPurchaseData = {
        userId: loggedUser?.id,
        amount: selectedCredits, // Usar los créditos seleccionados
        adminId: 1
      };

      console.log("Datos de compra:", tempPurchaseData);

      // Crear la solicitud primero
      console.log("Creando solicitud de compra...");
      const purchaseResponse = await createPurchaseRequest(tempPurchaseData);
      const tempPurchaseId = purchaseResponse.data.id;
      console.log("Compra creada con ID:", tempPurchaseId);

      // Ahora subir el comprobante
      console.log("Subiendo comprobante...");
      const response = await uploadPurchaseProof(tempPurchaseId, file);
      console.log("Comprobante subido exitosamente:", response.data);
      showSuccess("Comprobante subido exitosamente. Ahora puede confirmar la solicitud.");
      
      // Guardar el ID de la compra para poder confirmar después
      setPurchaseId(tempPurchaseId);
      console.log("=== ÉXITO uploadProofFile ===");
    } catch (error) {
      console.error("=== ERROR uploadProofFile ===");
      console.error("Error completo:", error);
      console.error("Response:", error.response?.data);
      showError(`Error al subir el comprobante: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleConfirm = async () => {
    if (!purchaseId) {
      showWarning("Primero debe adjuntar su comprobante");
      return;
    }

    try {
      // Actualizar el status de la compra a confirmada (status = 1)
      const response = await fetch(`${API_URL}/purchase/${purchaseId}/confirm`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log("Solicitud confirmada exitosamente");
        showSuccess("Solicitud confirmada y enviada al administrador para revisión.");
        // Redirigir a TreeHome después de confirmar
        navigate("/tree-home");
      } else {
        throw new Error('Error al confirmar la solicitud');
      }
    } catch (error) {
      console.error("Error al confirmar solicitud:", error);
      showError("Error al confirmar la solicitud");
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
        style={{ display: 'none' }}
      />

      {/* Header */}
      <header className="qrcode-display-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">←</span>
        </button>
        <div className="user-info">
          <span className="username">🍃 {loggedUser?.username || 'Usuario'}</span>
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
                  e.target.src = '/qrcodes/1.png';
                }}
              />
            </div>
          </div>

          {/* Credits Display */}
          <div className="credits-display">
            <div className="credits-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm2.5-10.5l-1.5 1.5c-.32-.4-.74-.75-1.24-1.01C13.5 6.5 12.8 6 12 6s-1.5.5-1.76 1.49c-.5.26-.92.61-1.24 1.01L7.5 6.5C8.5 5.5 10.2 5 12 5s3.5.5 4.5 1.5z"/>
              </svg>
            </div>
            <div className="credits-info">
              <span className="credits-text">CREDITOS: {selectedCredits}</span>
              <span className="price-text">PRECIO: {selectedPrice} Bs</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="btn-download" onClick={handleDownloadQR}>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Descargar QR
          </button>
          <button 
            className={`btn-attach ${selectedFile ? 'btn-success' : ''}`} 
            onClick={handleAttachProof}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
            </svg>
            {selectedFile ? 'Comprobante adjuntado' : 'Adjuntar comprobante'}
          </button>
          <button 
            className={`btn-confirm ${!purchaseId ? 'btn-disabled' : ''}`} 
            onClick={handleConfirm}
            disabled={!purchaseId}
          >
            <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            {purchaseId ? 'Confirmar solicitud' : 'Confirmar'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="qrcode-display-footer">
        <div className="footer-content">
          <span className="copyright">Copyright © 2020. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
