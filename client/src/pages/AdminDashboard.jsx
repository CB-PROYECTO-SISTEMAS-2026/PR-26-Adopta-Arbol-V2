import { useEffect, useState } from "react";
import "./AdminDashboard.css";
import CreateUser from "./CreateUser.jsx";
import ViewDetailsModal from "../components/ViewDetailsModal.jsx";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

export default function AdminDashboard() {
  const { users, loadUsers, deleteUser, acceptUser } = useUsers();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadUsers();
  }, []);

  // Resetear página cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Funciones para el modal de detalles
  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedUser(null);
  };

  // Función para manejar la eliminación con confirmación
  const handleDeleteUser = (user) => {
    showConfirm(
      `¿Estás seguro de que deseas eliminar al usuario ${user.name} ${user.lastName}?\n\nEsta acción no se puede deshacer.`,
      () => {
        deleteUser(user.id);
      }
    );
  };

  // Función para aceptar usuario
  const handleAcceptUser = async (user) => {
    showConfirm(
      `¿Estás seguro de que deseas aceptar al usuario ${user.name} ${user.lastName}?`,
      async () => {
        try {
          await acceptUser(user.id);
          showSuccess("Usuario aceptado exitosamente");
          // Recargar usuarios para ver los cambios
          loadUsers();
        } catch (error) {
          showError("Error al aceptar usuario: " + (error.response?.data?.message || error.message));
        }
      }
    );
  };

  // Filtrado por búsqueda y fechas
  const filteredUsers = users.filter((user) => {
    const fecha = new Date(user.registerDate);
    const afterStart = startDate ? fecha >= new Date(startDate) : true;
    const beforeEnd = endDate ? fecha <= new Date(endDate) : true;
    const matchesSearch =
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase());
    return afterStart && beforeEnd && matchesSearch;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

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

  return (
    <div className="dashboard-container">
      {/* Header con info del administrador */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Usuario</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      {/* Filtros de fecha y botón añadir */}
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
        <button className="add-user-btn" onClick={openModal}>
          <i className="bi bi-plus-lg"></i> Añadir Usuarios
        </button>
      </div>

      {/* Tabla de usuarios */}
      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Fecha de Registro</th>
              <th>Rol</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, index) => (
              <tr key={user.id || index}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">
                      <i className="bi bi-person-circle avatar-placeholder"></i>
                    </div>
                    {user.name}
                  </div>
                </td>
                <td>{user.lastName}</td>
                <td>{new Date(user.registerDate).toLocaleDateString()}</td>
                <td>{user.role}</td>
                <td className="actions-cell">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewDetails(user)}
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  {user.status === 2 && (
                    <button
                      className="action-btn accept-btn"
                      onClick={() => handleAcceptUser(user)}
                      title="Aceptar usuario"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                  )}
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDeleteUser(user)}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
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
              className={`pagination-btn ${
                currentPage === pageNum ? "active" : ""
              }`}
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
              className={`pagination-btn ${
                currentPage === totalPages ? "active" : ""
              }`}
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

      {/* Modal para crear usuario */}
      <CreateUser isOpen={isModalOpen} onClose={closeModal} />

      {/* Modal para ver detalles de usuario */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        data={selectedUser}
        type="user"
      />
    </div>
  );
}
