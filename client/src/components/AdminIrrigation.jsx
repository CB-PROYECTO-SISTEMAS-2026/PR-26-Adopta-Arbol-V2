import { useEffect, useState } from "react";
import { useIrrigations } from "../context/IrrigationContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import ViewDetailsModal from "./ViewDetailsModal.jsx";
import "./AdminIrrigation.css";

export default function AdminIrrigation() {
  const {
    irrigations,
    loading,
    error,
    loadIrrigations,
    approveIrrigation,
    rejectIrrigation,
  } = useIrrigations();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedIrrigation, setSelectedIrrigation] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getIrrigationStatusLabel = (status) => {
    switch (Number(status)) {
      case 0:
        return "Cancelado";
      case 1:
        return "Aprobado";
      case 2:
        return "Confirmado";
      case 3:
        return "Asignado";
      case 4:
        return "Pendiente";
      default:
        return "Desconocido";
    }
  };

  const getIrrigationStatusClass = (status) => {
    switch (Number(status)) {
      case 0:
        return "status-cancelled";
      case 1:
        return "status-approved";
      case 2:
        return "status-confirmed";
      case 3:
        return "status-assigned";
      case 4:
        return "status-pending";
      default:
        return "status-unknown";
    }
  };

  // Cargar riegos al montar el componente
  useEffect(() => {
    loadIrrigations();
  }, []);

  // Función para ver los detalles del riego
  const handleViewIrrigationDetails = (irrigation) => {
    setSelectedIrrigation(irrigation);
    setIsDetailsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedIrrigation(null);
  };

  // Función para aprobar riego con confirmación
  const handleApproveIrrigation = (irrigation) => {
    showConfirm(
      `¿Estás seguro de que deseas aprobar el riego de ${irrigation.userName} ${irrigation.userLastName} para el árbol ${irrigation.treeName}?`,
      async () => {
        const result = await approveIrrigation(irrigation.id);
        if (result.success) {
          showSuccess(`✅ ${result.message}`);
        } else {
          showError(`❌ Error: ${result.message}`);
        }
      },
    );
  };

  // Función para rechazar riego con confirmación
  const handleRejectIrrigation = (irrigation) => {
    showConfirm(
      `¿Estás seguro de que deseas rechazar el riego de ${irrigation.userName} ${irrigation.userLastName} para el árbol ${irrigation.treeName}?`,
      async () => {
        const result = await rejectIrrigation(irrigation.id);
        if (result.success) {
          showSuccess(`✅ ${result.message}`);
        } else {
          showError(`❌ Error: ${result.message}`);
        }
      },
    );
  };

  // Filtrado por búsqueda y fechas
  const filteredIrrigations = irrigations.filter((irrigation) => {
    const fecha = new Date(irrigation.registerDate);
    const afterStart = startDate ? fecha >= new Date(startDate) : true;
    const beforeEnd = endDate ? fecha <= new Date(endDate) : true;
    const matchesSearch =
      irrigation.userName.toLowerCase().includes(search.toLowerCase()) ||
      irrigation.userLastName.toLowerCase().includes(search.toLowerCase()) ||
      irrigation.treeName.toLowerCase().includes(search.toLowerCase()) ||
      irrigation.treeCode.toLowerCase().includes(search.toLowerCase());
    return afterStart && beforeEnd && matchesSearch;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredIrrigations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentIrrigations = filteredIrrigations.slice(startIndex, endIndex);

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

  if (loading) return <div className="loading">Cargando riegos...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar riegos..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Riegos</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      {/* Filtros de fecha */}
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
        <div className="status-info">
          <span className="results-count">
            {filteredIrrigations.length} riegos en total
          </span>
        </div>
      </div>

      {/* Tabla de riegos */}
      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Apellidos</th>
              <th>Fecha de Registro</th>
              <th>Árbol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentIrrigations.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-data">
                  No hay riegos registrados
                </td>
              </tr>
            ) : (
              currentIrrigations.map((irrigation, index) => {
                const canReview = Number(irrigation.status) === 2;

                return (
                  <tr key={irrigation.id || index}>
                    <td>
                      <div className="irrigation-cell">
                        <div className="user-avatar">
                          <i className="bi bi-person-circle avatar-placeholder"></i>
                        </div>
                        {irrigation.userName}
                      </div>
                    </td>
                    <td>{irrigation.userLastName}</td>
                    <td>
                      {new Date(irrigation.registerDate).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="tree-info">
                        <strong>{irrigation.treeName}</strong>
                        <br />
                        <small className="tree-code">
                          Código: {irrigation.treeCode}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`state-badge ${getIrrigationStatusClass(irrigation.status)}`}
                      >
                        {getIrrigationStatusLabel(irrigation.status)}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn view-btn"
                        onClick={() => handleViewIrrigationDetails(irrigation)}
                        title="Ver detalles"
                      >
                        <i className="bi bi-eye-fill"></i>
                      </button>
                      <button
                        className="action-btn check-btn"
                        onClick={() => handleApproveIrrigation(irrigation)}
                        title={
                          canReview
                            ? "Aprobar riego"
                            : "Solo se puede aprobar cuando está confirmado"
                        }
                        disabled={!canReview}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleRejectIrrigation(irrigation)}
                        title={
                          canReview
                            ? "Rechazar riego"
                            : "Solo se puede rechazar cuando está confirmado"
                        }
                        disabled={!canReview}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination-section">
          <button
            className="pagination-btn"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>

          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              className={`pagination-btn ${currentPage === pageNum ? "active" : ""}`}
              onClick={() => handlePageChange(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="pagination-dots">...</span>
          )}

          {totalPages > 5 && currentPage < totalPages - 1 && (
            <button
              className={`pagination-btn ${currentPage === totalPages ? "active" : ""}`}
              onClick={() => handlePageChange(totalPages)}
            >
              {totalPages}
            </button>
          )}

          <button
            className="pagination-btn"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>
        </div>
      )}

      {/* Modal para ver detalles de riego */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        data={selectedIrrigation}
        type="irrigation"
      />
    </div>
  );
}
