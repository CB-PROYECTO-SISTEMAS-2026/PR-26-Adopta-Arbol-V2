import React, { useEffect, useState } from "react";
import "./AdminAdoption.css";
import ViewDetailsModal from "./ViewDetailsModal.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  getAdoptionsRequest,
  approveAdoptionRequest,
  rejectAdoptionRequest,
} from "../api/adoption.api.js";
import { getUserByIdRequest } from "../api/user.api.js";

export default function AdminAdoption() {
  const [adoptions, setAdoptions] = useState([]);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedAdoption, setSelectedAdoption] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const { showSuccess, showError, showConfirm } = useNotification();

  useEffect(() => {
    loadAdoptions();
  }, []);

  const loadAdoptions = async () => {
    try {
      const data = await getAdoptionsRequest();
      setAdoptions(data || []);
    } catch (error) {
      console.error("Error cargando adopciones:", error);
    }
  };

  const aprobar = async (id) => {
    const adoption = adoptions.find(a => a.id === id);
    const adoptionInfo = adoption ? `${adoption.nombres} ${adoption.apellidos}` : "esta adopción";
    
    showConfirm(
      `¿Estás seguro de que deseas aprobar la adopción de ${adoptionInfo}?`,
      async () => {
        try {
          await approveAdoptionRequest(id);
          showSuccess("Adopción aprobada exitosamente");
          loadAdoptions();
        } catch (error) {
          console.error("Error al aprobar adopción:", error);
          showError("Error al aprobar la adopción. Inténtalo nuevamente.");
        }
      }
    );
  };

  const rechazar = async (id) => {
    const adoption = adoptions.find(a => a.id === id);
    const adoptionInfo = adoption ? `${adoption.nombres} ${adoption.apellidos}` : "esta adopción";
    
    showConfirm(
      `¿Estás seguro de que deseas rechazar la adopción de ${adoptionInfo}? Los créditos serán devueltos al usuario.`,
      async () => {
        try {
          await rejectAdoptionRequest(id);
          showSuccess("Adopción rechazada y créditos devueltos al usuario exitosamente");
          loadAdoptions();
        } catch (error) {
          console.error("Error al rechazar adopción:", error);
          showError("Error al rechazar la adopción. Inténtalo nuevamente.");
        }
      }
    );
  };

  // Función para ver los detalles de la adopción
  const handleViewAdoptionDetails = (adoption) => {
    setSelectedAdoption(adoption);
    setIsDetailsModalOpen(true);
  };

  // Función para cerrar el modal
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedAdoption(null);
  };

  // Filtrado por búsqueda y fechas
  const filteredAdoptions = adoptions.filter((a) => {
    const fecha = new Date(a.fecha_registro);
    const afterStart = startDate ? fecha >= new Date(startDate) : true;
    const beforeEnd = endDate ? fecha <= new Date(endDate) : true;
    const matchesSearch =
      a.nombres.toLowerCase().includes(search.toLowerCase()) ||
      a.apellidos.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo_arbol.toLowerCase().includes(search.toLowerCase());
    return afterStart && beforeEnd && matchesSearch;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredAdoptions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAdoptions = filteredAdoptions.slice(startIndex, endIndex);

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

  return (
    <div className="dashboard-container">
      {/* Header con búsqueda */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar adopciones..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Adopciones</span>
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

      {/* Tabla de adopciones */}
      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Fecha de Registro</th>
              <th>Árbol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentAdoptions.map((a) => (
              <tr key={a.id}>
                <td>
                  <div className="adoption-cell">
                    <div className="user-avatar">
                      <i className="bi bi-person-circle avatar-placeholder"></i>
                    </div>
                    {a.nombres}
                  </div>
                </td>
                <td>{a.apellidos}</td>
                <td>{new Date(a.fecha_registro).toLocaleDateString()}</td>
                <td>{a.codigo_arbol}</td>
                <td className="actions-cell">
                  <button
                    className="action-btn details-btn"
                    onClick={() => handleViewAdoptionDetails(a)}
                    title="Ver detalles"
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  {a.status === 2 && (
                    <>
                      <button
                        className="action-btn approve-btn"
                        onClick={() => aprobar(a.id)}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="action-btn reject-btn"
                        onClick={() => rechazar(a.id)}
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
              className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
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
              className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
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

      {/* Modal para ver detalles de adopción */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        data={selectedAdoption}
        type="adoption"
      />
    </div>
  );
}
