import React, { useEffect, useState } from "react";
import "./BuyCredits.css";
import ViewDetailsModal from "./ViewDetailsModal.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import {
  confirmRedemption,
  getPendingRedemptions,
  getRedemptionDetails,
  rejectRedemption,
} from "../api/redemption.api.js";
import { useUsers } from "../context/UserContext.jsx";

export default function AdminRedemptions() {
  const { loggedUser } = useUsers();
  const { showSuccess, showError, showConfirm } = useNotification();
  const [redemptions, setRedemptions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadRedemptions();
  }, []);

  const loadRedemptions = async () => {
    try {
      setLoading(true);
      const response = await getPendingRedemptions();
      setRedemptions(response.data || []);
    } catch (error) {
      console.error("Error cargando retiros:", error);
      showError("Error al cargar retiros pendientes");
    } finally {
      setLoading(false);
    }
  };

  const aceptarRetiro = async (id) => {
    const redemption = redemptions.find((item) => item.id === id);
    const redemptionInfo = redemption
      ? `${redemption.name} ${redemption.lastName}`
      : "este retiro";

    showConfirm(
      `¿Estás seguro de que deseas aceptar el retiro de ${redemptionInfo}?`,
      async () => {
        try {
          const adminId = loggedUser?.id || 1;
          await confirmRedemption(id, adminId);
          showSuccess("Retiro aceptado exitosamente");
          await loadRedemptions();
        } catch (error) {
          console.error("Error aceptando retiro:", error);
          showError("Error al aceptar el retiro. Inténtalo nuevamente.");
        }
      },
    );
  };

  const cancelarRetiro = async (id) => {
    const redemption = redemptions.find((item) => item.id === id);
    const redemptionInfo = redemption
      ? `${redemption.name} ${redemption.lastName}`
      : "este retiro";

    showConfirm(
      `¿Estás seguro de que deseas cancelar el retiro de ${redemptionInfo}?`,
      async () => {
        try {
          const adminId = loggedUser?.id || 1;
          await rejectRedemption(id, adminId);
          showSuccess("Retiro cancelado exitosamente");
          await loadRedemptions();
        } catch (error) {
          console.error("Error cancelando retiro:", error);
          showError("Error al cancelar el retiro. Inténtalo nuevamente.");
        }
      },
    );
  };

  const verDetalles = async (redemption) => {
    try {
      const detailsResponse = await getRedemptionDetails(redemption.id);
      setSelected({ ...redemption, ...detailsResponse.data });
      setShowModal(true);
    } catch (error) {
      console.error("Error obteniendo detalles del retiro:", error);
      setSelected(redemption);
      setShowModal(true);
      showError("No se pudieron cargar todos los detalles del retiro");
    }
  };

  const cerrarModal = () => {
    setSelected(null);
    setShowModal(false);
  };

  const getStatusText = (status) => {
    switch (parseInt(status, 10)) {
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
    switch (parseInt(status, 10)) {
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

  const filteredRedemptions = redemptions.filter((item) => {
    const registerDate = new Date(item.registerDate);
    const fromDate = startDate ? new Date(startDate) : null;
    const toDate = endDate ? new Date(endDate) : null;

    if (fromDate) {
      fromDate.setHours(0, 0, 0, 0);
    }

    if (toDate) {
      toDate.setHours(23, 59, 59, 999);
    }

    const afterStart = fromDate ? registerDate >= fromDate : true;
    const beforeEnd = toDate ? registerDate <= toDate : true;

    const fullName = `${item.name || ""} ${item.lastName || ""}`
      .trim()
      .toLowerCase();
    const matchesSearch = fullName.includes(search.toLowerCase());

    return afterStart && beforeEnd && matchesSearch;
  });

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <p>Cargando retiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar por nombre..."
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Retiros</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <div className="date-filters">
          <div className="date-input-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              className="date-input"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              className="date-input"
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
        </div>
      </div>

      <section className="table-section">
        <table className="users-table">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Apellidos</th>
              <th>Cantidad</th>
              <th>Fecha de Registro</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredRedemptions.length > 0 ? (
              filteredRedemptions.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="purchase-cell">
                      <div className="user-avatar">
                        <i className="bi bi-person-circle avatar-placeholder"></i>
                      </div>
                      {item.name}
                    </div>
                  </td>
                  <td>{item.lastName}</td>
                  <td>
                    {item.amount
                      ? `${parseFloat(item.amount).toFixed(2)} Bs`
                      : "0.00 Bs"}
                  </td>
                  <td>{new Date(item.registerDate).toLocaleDateString()}</td>
                  <td>
                    <span
                      className={`payment-status ${getStatusClass(item.status)}`}
                    >
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="action-btn details-btn"
                      onClick={() => verDetalles(item)}
                      title="Ver detalles"
                    >
                      <i className="bi bi-eye-fill"></i>
                    </button>
                    {parseInt(item.status, 10) === 2 && (
                      <>
                        <button
                          className="action-btn approve-btn"
                          onClick={() => aceptarRetiro(item.id)}
                          title="Aceptar retiro"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          className="action-btn reject-btn"
                          onClick={() => cancelarRetiro(item.id)}
                          title="Cancelar retiro"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
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
                  No hay retiros pendientes
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <ViewDetailsModal
        isOpen={showModal}
        onClose={cerrarModal}
        data={selected}
        type="redemption"
      />
    </div>
  );
}
