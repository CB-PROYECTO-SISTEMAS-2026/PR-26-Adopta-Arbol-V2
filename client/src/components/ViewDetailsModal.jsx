import React, { useEffect, useMemo, useState } from "react";
import "./ViewDetailsModal.css";
import EvidenceImage from "./EvidenceImage.jsx";
import { getStaticUrl } from "../config/api.config.js";

// Componente para cargar imágenes de recibos dinámicamente
const ReceiptImage = ({ purchaseId }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tryLoadImage = async () => {
      setLoading(true);
      setError(false);

      const extensions = ["png", "jpg", "jpeg"];

      for (const ext of extensions) {
        const imagePath = `/receipts/${purchaseId}.${ext}`;

        try {
          const imageExists = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
          });

          if (imageExists) {
            setImageSrc(imagePath);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.log(`Failed to load: ${imagePath}`);
        }
      }

      setError(true);
      setLoading(false);
    };

    if (purchaseId) {
      tryLoadImage();
    }
  }, [purchaseId]);

  if (loading) {
    return <div className="loading-message">Cargando comprobante...</div>;
  }

  if (error || !imageSrc) {
    return <div className="no-receipt">No se encontró el comprobante</div>;
  }

  return (
    <img
      src={imageSrc}
      alt="Comprobante de compra"
      className="receipt-qr-image"
    />
  );
};

function ViewDetailsModal({
  isOpen,
  onClose,
  data,
  type = "user",
  onDeactivate,
}) {
  // Función para obtener el texto del estado
  const getStatusText = (status) => {
    switch (parseInt(status)) {
      case 0:
        return "Inactivo";
      case 1:
        return "Activo";
      case 2:
        return "Pendiente";
      default:
        return "Desconocido";
    }
  };

  // Función para obtener la clase CSS del estado
  const getStatusClass = (status) => {
    switch (parseInt(status)) {
      case 0:
        return "status-inactive";
      case 1:
        return "status-active";
      case 2:
        return "status-pending";
      default:
        return "status-unknown";
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Función para formatear fecha simple (solo día/mes/año)
  const formatDateSimple = (dateString) => {
    if (!dateString) return "No disponible";
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open");
    } else {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open");
    }

    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open");
    };
  }, [isOpen]);

  const treeImages = useMemo(() => {
    if (!data) return [];

    if (Array.isArray(data.imagePaths)) {
      return data.imagePaths.filter(Boolean);
    }

    if (typeof data.imagePaths === "string" && data.imagePaths.length > 0) {
      return data.imagePaths
        .split(",")
        .map((path) => path.trim())
        .filter((path) => path.length > 0);
    }

    if (data?.imagePath) {
      return [data.imagePath];
    }

    return [];
  }, [data]);

  const [currentTreeImageIndex, setCurrentTreeImageIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentTreeImageIndex(0);
    }
  }, [isOpen, data?.id]);

  useEffect(() => {
    if (currentTreeImageIndex >= treeImages.length && treeImages.length > 0) {
      setCurrentTreeImageIndex(0);
    }
  }, [treeImages.length, currentTreeImageIndex]);

  const handlePrevTreeImage = () => {
    if (treeImages.length <= 1) return;
    setCurrentTreeImageIndex((prev) =>
      prev === 0 ? treeImages.length - 1 : prev - 1,
    );
  };

  const handleNextTreeImage = () => {
    if (treeImages.length <= 1) return;
    setCurrentTreeImageIndex((prev) =>
      prev === treeImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleSelectTreeImage = (index) => {
    setCurrentTreeImageIndex(index);
  };

  const buildImageUrl = (path) => {
    return getStaticUrl(path);
  };

  if (!isOpen || !data) return null;

  return (
    <div
      className="modal-overlay details-modal-overlay"
      onClick={handleOverlayClick}
    >
      <div
        className={`modal-content details-modal-content ${
          type === "user"
            ? "modal-user"
            : type === "adoption"
              ? "modal-adoption"
              : type === "irrigation"
                ? "modal-irrigation"
                : type === "purchase"
                  ? "modal-purchase"
                  : type === "redemption"
                    ? "modal-redemption"
                    : type === "category"
                      ? "modal-category"
                      : type === "qrcode"
                        ? "modal-qrcode"
                        : type === "tree"
                          ? "modal-tree"
                          : ""
        }`}
      >
        {type === "user" ? (
          // Diseño especial para usuarios
          <>
            {/* Header con fondo verde */}
            <div className="user-header">
              {/* Botón cerrar */}
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Avatar circular */}
              <div className="user-header-icon">
                <i className="bi bi-person"></i>
              </div>
            </div>

            {/* Cuerpo del modal */}
            <div className="user-body">
              {/* Nombre del usuario */}
              <h2 className="user-name">
                {`${data.name || ""} ${data.lastName || ""}`.trim() ||
                  "Usuario"}
              </h2>

              {/* Información en dos columnas */}
              <div className="user-info-grid">
                <div className="user-info-item">
                  <label className="user-info-label">Nombre de Usuario</label>
                  <span className="user-info-value">
                    {data.username || "No disponible"}
                  </span>
                </div>

                <div className="user-info-item">
                  <label className="user-info-label">Créditos</label>
                  <span className="user-info-value">
                    {data.credits || "0.00"}
                  </span>
                </div>

                <div className="user-info-item">
                  <label className="user-info-label">Email</label>
                  <span className="user-info-value">
                    {data.email || "No disponible"}
                  </span>
                </div>

                <div className="user-info-item">
                  <label className="user-info-label">Rol</label>
                  <span className="user-info-value">
                    {data.role || "No asignado"}
                  </span>
                </div>

                <div className="user-info-item">
                  <label className="user-info-label">Fecha de Registro</label>
                  <span className="user-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>

                <div className="user-info-item">
                  <label className="user-info-label">Estado</label>
                  <span className="user-info-value">
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>

              {/* Botón cerrar */}
              <button className="user-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "adoption" ? (
          // Diseño especial para adopciones
          <>
            {/* Header con fondo verde */}
            <div className="adoption-header">
              {/* Botón cerrar */}
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Avatar circular con corazón */}
              <div className="adoption-header-icon">
                <i className="bi bi-heart-fill"></i>
              </div>
            </div>

            {/* Cuerpo del modal */}
            <div className="adoption-body">
              {/* Nombre del adoptante */}
              <h2 className="user-name">
                {`${data.nombres || ""} ${data.apellidos || ""}`.trim() ||
                  "Adoptante"}
              </h2>

              {/* Información en dos columnas */}
              <div className="adoption-info-grid">
                <div className="adoption-info-item">
                  <label className="adoption-info-label">Adoptante</label>
                  <span className="adoption-info-value">
                    {`${data.nombres || ""} ${data.apellidos || ""}`.trim() ||
                      "No disponible"}
                  </span>
                </div>

                <div className="adoption-info-item">
                  <label className="adoption-info-label">
                    Código del Árbol
                  </label>
                  <span className="adoption-info-value">
                    {data.codigo_arbol || "No disponible"}
                  </span>
                </div>

                <div className="adoption-info-item">
                  <label className="adoption-info-label">Ubicación</label>
                  <span className="adoption-info-value">
                    {data.ubicacion || "No disponible"}
                  </span>
                </div>

                <div className="adoption-info-item">
                  <label className="adoption-info-label">Tipo de Árbol</label>
                  <span className="adoption-info-value">
                    {data.tipo_arbol || "No disponible"}
                  </span>
                </div>

                <div className="adoption-info-item">
                  <label className="adoption-info-label">
                    Fecha de Registro
                  </label>
                  <span className="adoption-info-value">
                    {formatDateSimple(data.fecha_registro)}
                  </span>
                </div>

                <div className="adoption-info-item">
                  <label className="adoption-info-label">Estado</label>
                  <span className="adoption-info-value">
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>

              {/* Foto del adoptante si existe */}
              {data.foto && (
                <div className="adoption-photo-section">
                  <label className="adoption-info-label">
                    Foto del Adoptante
                  </label>
                  <img
                    src={data.foto}
                    alt={`${data.nombres} ${data.apellidos}`}
                    className="adoption-photo"
                  />
                </div>
              )}

              {/* Botón cerrar */}
              <button className="adoption-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "irrigation" ? (
          // Diseño especial para riegos
          <>
            <div className="irrigation-header">
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="irrigation-header-icon">
                <i className="bi bi-droplet-fill"></i>
              </div>
            </div>

            <div className="irrigation-body">
              <h2 className="user-name">
                {`Riego por ${data.userName || ""} ${
                  data.userLastName || ""
                }`.trim()}
              </h2>

              <div className="irrigation-info-grid">
                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">Árbol</label>
                  <span className="irrigation-info-value">
                    {data.treeName || "No disponible"}
                  </span>
                </div>

                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">
                    Código del Árbol
                  </label>
                  <span className="irrigation-info-value">
                    {data.treeCode || "No disponible"}
                  </span>
                </div>

                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">Usuario</label>
                  <span className="irrigation-info-value">
                    {`${data.userName || ""} ${
                      data.userLastName || ""
                    }`.trim() || "No disponible"}
                  </span>
                </div>

                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">Recompensa</label>
                  <span className="irrigation-info-value">
                    ${data.reward || "0.00"}
                  </span>
                </div>

                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">
                    Fecha de Riego
                  </label>
                  <span className="irrigation-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>

                <div className="irrigation-info-item">
                  <label className="irrigation-info-label">Estado</label>
                  <span className="irrigation-info-value">
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>

              {data.observations && (
                <div className="irrigation-observations">
                  <label className="irrigation-info-label">Observaciones</label>
                  <p className="irrigation-observation-text">
                    {data.observations}
                  </p>
                </div>
              )}

              <div className="irrigation-evidence">
                <label className="irrigation-info-label">Evidencia</label>
                <div className="evidence-image-section">
                  <EvidenceImage irrigationId={data.id} />
                </div>
              </div>

              <button className="irrigation-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "purchase" ? (
          // Diseño especial para compras de créditos
          <>
            {/* Header con fondo verde */}
            <div className="purchase-header">
              {/* Botón cerrar */}
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Icono de moneda */}
              <div className="purchase-header-icon">
                <i className="bi bi-coin"></i>
              </div>
            </div>

            {/* Cuerpo del modal */}
            <div className="purchase-body">
              {/* Nombre del usuario */}
              <h2 className="user-name">
                {`${data.name || ""} ${data.lastName || ""}`.trim() ||
                  "Compra de Créditos"}
              </h2>

              {/* Información en dos columnas */}
              <div className="purchase-info-grid">
                <div className="purchase-info-item">
                  <label className="purchase-info-label">Usuario</label>
                  <span className="purchase-info-value">
                    {`${data.name || ""} ${data.lastName || ""}`.trim() ||
                      "No disponible"}
                  </span>
                </div>

                <div className="purchase-info-item">
                  <label className="purchase-info-label">
                    Créditos Comprados
                  </label>
                  <span className="purchase-info-value">
                    {data.amount || "0.00"}
                  </span>
                </div>

                <div className="purchase-info-item">
                  <label className="purchase-info-label">Email</label>
                  <span className="purchase-info-value">
                    {data.email || "No disponible"}
                  </span>
                </div>

                <div className="purchase-info-item">
                  <label className="purchase-info-label">Estado</label>
                  <span className="purchase-info-value">
                    {data.status === 1
                      ? "Aprobado"
                      : data.status === 0
                        ? "Rechazado"
                        : "Pendiente"}
                  </span>
                </div>

                <div className="purchase-info-item">
                  <label className="purchase-info-label">Fecha</label>
                  <span className="purchase-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>
              </div>

              {/* Comprobante de pago */}
              <div className="purchase-receipt-section">
                <label className="purchase-info-label">
                  Comprobante de Pago
                </label>
                <div className="purchase-receipt-container">
                  <ReceiptImage purchaseId={data.id} />
                </div>
              </div>

              {/* Botón cerrar */}
              <button className="purchase-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "redemption" ? (
          // Diseño especial para redenciones de AdminQr
          <>
            {/* Header con fondo verde */}
            <div className="redemption-header">
              {/* Botón cerrar */}
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>

              {/* Icono de QR */}
              <div className="redemption-header-icon">
                <i className="bi bi-qr-code"></i>
              </div>
            </div>

            {/* Cuerpo del modal */}
            <div className="redemption-body">
              {/* Nombre del usuario */}
              <h2 className="user-name">
                {`${data.name || ""} ${data.lastName || ""}`.trim() ||
                  "Redención"}
              </h2>

              {/* Información en dos columnas */}
              <div className="redemption-info-grid">
                <div className="redemption-info-item">
                  <label className="redemption-info-label">Usuario</label>
                  <span className="redemption-info-value">
                    {`${data.name || ""} ${data.lastName || ""}`.trim() ||
                      "No disponible"}
                  </span>
                </div>

                <div className="redemption-info-item">
                  <label className="redemption-info-label">Cantidad</label>
                  <span className="redemption-info-value">
                    {data.amount || "0.00"}
                  </span>
                </div>

                <div className="redemption-info-item">
                  <label className="redemption-info-label">Email</label>
                  <span className="redemption-info-value">
                    {data.email || "No disponible"}
                  </span>
                </div>

                <div className="redemption-info-item">
                  <label className="redemption-info-label">Estado</label>
                  <span className="redemption-info-value">
                    {parseInt(data.status, 10) === 1
                      ? "Aprobado"
                      : parseInt(data.status, 10) === 0
                        ? "Rechazado"
                        : "Pendiente"}
                  </span>
                </div>

                <div className="redemption-info-item">
                  <label className="redemption-info-label">Fecha</label>
                  <span className="redemption-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>
              </div>

              {/* Código QR */}
              {data.qrUrl && (
                <div className="redemption-qr-section">
                  <label className="redemption-info-label">Código QR</label>
                  <div className="redemption-qr-container">
                    <img
                      src={getStaticUrl(data.qrUrl)}
                      alt="Código QR"
                      className="redemption-qr-image"
                    />
                  </div>
                </div>
              )}

              {/* Botón cerrar */}
              <button className="redemption-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "category" ? (
          // Diseño especial para categorías
          <>
            <div className="category-header">
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="category-header-icon">
                <i className="bi bi-tags-fill"></i>
              </div>
            </div>

            <div className="category-body">
              <h2 className="user-name">{data.name || "Categoría"}</h2>

              <div className="category-info-grid">
                <div className="category-info-item">
                  <label className="category-info-label">
                    Nombre de la Categoría
                  </label>
                  <span className="category-info-value">
                    {data.name || "No disponible"}
                  </span>
                </div>

                <div className="category-info-item">
                  <label className="category-info-label">Usuario Creador</label>
                  <span className="category-info-value">
                    {`${data.userName || ""} ${
                      data.userLastName || ""
                    }`.trim() || "No disponible"}
                  </span>
                </div>

                <div className="category-info-item">
                  <label className="category-info-label">
                    Fecha de Registro
                  </label>
                  <span className="category-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>

                <div className="category-info-item">
                  <label className="category-info-label">
                    Última Actualización
                  </label>
                  <span className="category-info-value">
                    {formatDateSimple(data.lastUpdate)}
                  </span>
                </div>

                <div className="category-info-item">
                  <label className="category-info-label">ID de Usuario</label>
                  <span className="category-info-value">
                    {data.userId || "No disponible"}
                  </span>
                </div>

                <div className="category-info-item">
                  <label className="category-info-label">Estado</label>
                  <span className="category-info-value">
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>

              <button className="category-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        ) : type === "qrcode" ? (
          // Diseño especial para Códigos QR
          <>
            <div className="qrcode-header">
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="qrcode-header-icon">
                <i className="bi bi-qr-code-scan"></i>
              </div>
            </div>

            <div className="qrcode-body">
              <h2 className="user-name">Código QR #{data.id || "N/A"}</h2>

              <div className="qrcode-info-grid">
                <div className="qrcode-info-item">
                  <label className="qrcode-info-label">Estado</label>
                  <span className="qrcode-info-value">
                    {data.status === 1 ? "✅ Activo" : "❌ Inactivo"}
                  </span>
                </div>

                <div className="qrcode-info-item">
                  <label className="qrcode-info-label">
                    Fecha de Vencimiento
                  </label>
                  <span className="qrcode-info-value">
                    {data.expirationDate
                      ? formatDateSimple(data.expirationDate)
                      : "Sin fecha asignada"}
                  </span>
                </div>

                <div className="qrcode-info-item">
                  <label className="qrcode-info-label">Fecha de Registro</label>
                  <span className="qrcode-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>

                {data.userId && (
                  <div className="qrcode-info-item">
                    <label className="qrcode-info-label">Usuario</label>
                    <span className="qrcode-info-value">
                      {`${data.userName || ""} ${data.userLastName || ""}`.trim() ||
                        "No disponible"}
                    </span>
                  </div>
                )}
              </div>

              {/* Imagen del QR */}
              {data.url && (
                <div className="qrcode-image-section">
                  <label className="qrcode-info-label">Código QR</label>
                  <div className="qrcode-image-container">
                    <img
                      src={getStaticUrl(data.url)}
                      alt={`QR ${data.id}`}
                      className="qrcode-image"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // Diseño para árboles
          <>
            <div className="tree-header">
              <button className="modal-close-simple" onClick={onClose}>
                <i className="bi bi-x-lg"></i>
              </button>
              <div className="tree-header-icon">
                <i className="bi bi-tree-fill"></i>
              </div>
            </div>

            <div className="tree-body">
              <h2 className="user-name">{data.name || "Árbol"}</h2>

              <div className="tree-info-grid">
                <div className="tree-info-item">
                  <label className="tree-info-label">Código</label>
                  <span className="tree-info-value">
                    {data.code || "No disponible"}
                  </span>
                </div>

                <div className="tree-info-item">
                  <label className="tree-info-label">Precio</label>
                  <span className="tree-info-value">
                    ${data.price || "0.00"}
                  </span>
                </div>

                <div className="tree-info-item">
                  <label className="tree-info-label">Dirección</label>
                  <span className="tree-info-value">
                    {data.address || "No disponible"}
                  </span>
                </div>

                <div className="tree-info-item">
                  <label className="tree-info-label">Usuario Responsable</label>
                  <span className="tree-info-value">
                    {`${data.userName || ""} ${
                      data.userLastName || ""
                    }`.trim() || "No asignado"}
                  </span>
                </div>

                <div className="tree-info-item">
                  <label className="tree-info-label">Fecha de Registro</label>
                  <span className="tree-info-value">
                    {formatDateSimple(data.registerDate)}
                  </span>
                </div>

                <div className="tree-info-item">
                  <label className="tree-info-label">Estado</label>
                  <span className="tree-info-value">
                    {getStatusText(data.status)}
                  </span>
                </div>
              </div>

              {data.description && (
                <div className="tree-description-section">
                  <label className="tree-info-label">Descripción</label>
                  <p className="tree-description-text">{data.description}</p>
                </div>
              )}

              {/* Imágenes del árbol */}
              {treeImages.length > 0 && (
                <div className="tree-image-section">
                  <label className="tree-info-label">Imágenes del Árbol</label>
                  <div className="tree-carousel">
                    {treeImages.length > 1 && (
                      <button
                        type="button"
                        className="tree-carousel-button prev"
                        onClick={handlePrevTreeImage}
                        aria-label="Imagen anterior"
                      >
                        <i
                          className="bi bi-chevron-left"
                          aria-hidden="true"
                        ></i>
                      </button>
                    )}
                    <div className="tree-carousel-main">
                      <img
                        src={buildImageUrl(treeImages[currentTreeImageIndex])}
                        alt={`${data.name || "Árbol"} - Imagen ${
                          currentTreeImageIndex + 1
                        }`}
                        className="tree-image"
                        onError={(e) => {
                          console.error(
                            "Error al cargar imagen:",
                            e.target.src,
                          );
                          e.target.style.display = "none";
                          const container = e.target.parentElement;
                          if (container) {
                            container.innerHTML =
                              '<div class="no-image">No se pudo cargar la imagen</div>';
                          }
                        }}
                      />
                    </div>
                    {treeImages.length > 1 && (
                      <button
                        type="button"
                        className="tree-carousel-button next"
                        onClick={handleNextTreeImage}
                        aria-label="Imagen siguiente"
                      >
                        <i
                          className="bi bi-chevron-right"
                          aria-hidden="true"
                        ></i>
                      </button>
                    )}
                  </div>
                  {treeImages.length > 1 && (
                    <div className="tree-carousel-thumbs">
                      {treeImages.map((imagePath, index) => (
                        <button
                          type="button"
                          key={`${imagePath}-${index}`}
                          className={`tree-carousel-thumb ${
                            index === currentTreeImageIndex ? "active" : ""
                          }`}
                          onClick={() => handleSelectTreeImage(index)}
                          aria-label={`Ver imagen ${index + 1}`}
                        >
                          <img
                            src={buildImageUrl(imagePath)}
                            alt={`Miniatura ${index + 1}`}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="tree-close-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ViewDetailsModal;
