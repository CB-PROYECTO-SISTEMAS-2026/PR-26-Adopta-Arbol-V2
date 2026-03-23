import React, { useEffect, useState } from "react";
import "./BuyCredits.css";
import ViewDetailsModal from "./ViewDetailsModal.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  getAllPurchases,
  approvePurchase,
  rejectPurchase,
} from "../api/credit.api.js";
import { useUsers } from "../context/UserContext";

// Componente para cargar imágenes de recibos dinámicamente
const ReceiptImage = ({ purchaseId }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const tryLoadImage = async () => {
      setLoading(true);
      setError(false);

      // Extensiones a probar en orden de prioridad
      const extensions = ["png", "jpg", "jpeg"];

      for (const ext of extensions) {
        const imagePath = `/receipts/${purchaseId}.${ext}`;

        try {
          // Crear una promesa para verificar si la imagen existe
          const imageExists = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
          });

          if (imageExists) {
            setImageSrc(imagePath);
            setLoading(false);
            console.log(`Receipt image found: ${imagePath}`);
            return;
          }
        } catch (err) {
          console.log(`Failed to load: ${imagePath}`);
        }
      }

      // Si no se encontró ninguna imagen
      setError(true);
      setLoading(false);
      console.log(`No receipt image found for purchase ID: ${purchaseId}`);
    };

    if (purchaseId) {
      tryLoadImage();
    }
  }, [purchaseId]);

  if (loading) {
    return (
      <div className="loading-receipt">
        <i className="bi bi-hourglass-split"></i>
        <p>Cargando comprobante...</p>
      </div>
    );
  }

  if (error || !imageSrc) {
    return (
      <div className="no-qr">
        <i className="bi bi-exclamation-triangle"></i>
        <p>
          No hay comprobante disponible para este registro (ID: {purchaseId})
        </p>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt="Comprobante de compra"
      className="qr-image"
      onError={() => {
        console.error(`Error displaying image: ${imageSrc}`);
        setError(true);
      }}
      onLoad={() => {
        console.log(`Receipt image displayed successfully: ${imageSrc}`);
      }}
    />
  );
};

export default function BuyCredits() {
  const { loggedUser } = useUsers(); // Obtener usuario logueado
  const { showSuccess, showError, showConfirm } = useNotification();
  const [purchases, setPurchases] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      const response = await getAllPurchases();
      setPurchases(response.data || []);
    } catch (error) {
      console.error("Error cargando compras:", error);
    } finally {
      setLoading(false);
    }
  };

  const aprobar = async (id) => {
    const purchase = purchases.find((p) => p.id === id);
    const purchaseInfo = purchase
      ? `${purchase.name} ${purchase.lastName}`
      : "esta compra";

    showConfirm(
      `¿Estás seguro de que deseas aprobar la compra de ${purchaseInfo}?`,
      async () => {
        try {
          const adminId = loggedUser?.id || 1; // Usar ID del usuario logueado
          console.log("Aprobando compra con adminId:", adminId);
          await approvePurchase(id, adminId);
          showSuccess("Compra aprobada exitosamente");
          loadPurchases();
        } catch (error) {
          console.error("Error aprobando compra:", error);
          showError("Error al aprobar la compra. Inténtalo nuevamente.");
        }
      },
    );
  };

  const rechazar = async (id) => {
    const purchase = purchases.find((p) => p.id === id);
    const purchaseInfo = purchase
      ? `${purchase.name} ${purchase.lastName}`
      : "esta compra";

    showConfirm(
      `¿Estás seguro de que deseas rechazar la compra de ${purchaseInfo}?`,
      async () => {
        try {
          const adminId = loggedUser?.id || 1; // Usar ID del usuario logueado
          console.log("Rechazando compra con adminId:", adminId);
          await rejectPurchase(id, adminId);
          showSuccess("Compra rechazada exitosamente");
          loadPurchases();
        } catch (error) {
          console.error("Error rechazando compra:", error);
          showError("Error al rechazar la compra. Inténtalo nuevamente.");
        }
      },
    );
  };

  const verDetalles = (purchase) => {
    setSelected(purchase);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setSelected(null);
    setShowModal(false);
  };

  // Filtrado por búsqueda y fechas
  const filteredPurchases = purchases.filter((p) => {
    const fecha = new Date(p.registerDate);
    const afterStart = startDate ? fecha >= new Date(startDate) : true;
    const beforeEnd = endDate ? fecha <= new Date(endDate) : true;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.lastName.toLowerCase().includes(search.toLowerCase());
    return afterStart && beforeEnd && matchesSearch;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPurchases = filteredPurchases.slice(startIndex, endIndex);

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

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const getStatusText = (status) => {
    switch (parseInt(status)) {
      case 0:
        return "Rechazado";
      case 1:
        return "Aprobado";
      case 2:
        return "Pendiente";
      default:
        return "Desconocido";
    }
  };

  const getStatusClass = (status) => {
    switch (parseInt(status)) {
      case 0:
        return "status-rejected";
      case 1:
        return "status-approved";
      case 2:
        return "status-pending";
      default:
        return "status-unknown";
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <p>Cargando compras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header con búsqueda */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Compras</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="filters-section">
        <div className="date-filters">
          <div className="date-input-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Tabla de compras */}
      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Fecha de Registro</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentPurchases.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="purchase-cell">
                    <div className="user-avatar">
                      <i className="bi bi-person-circle avatar-placeholder"></i>
                    </div>
                    {p.name}
                  </div>
                </td>
                <td>{p.lastName}</td>
                <td>{new Date(p.registerDate).toLocaleDateString()}</td>
                <td>
                  {p.price ? `${parseFloat(p.price).toFixed(2)} Bs` : "N/A"}
                </td>
                <td>
                  <span className={`status-badge ${getStatusClass(p.status)}`}>
                    {getStatusText(p.status)}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="action-btn details-btn"
                    onClick={() => verDetalles(p)}
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  {p.status === 2 && (
                    <>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => aprobar(p.id)}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => rechazar(p.id)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Modal de detalles del comprobante */}
      <ViewDetailsModal
        isOpen={showModal}
        onClose={cerrarModal}
        data={selected}
        type="purchase"
      />
    </div>
  );
}
