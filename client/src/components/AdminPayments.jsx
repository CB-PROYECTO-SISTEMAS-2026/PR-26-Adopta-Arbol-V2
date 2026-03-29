import { useEffect, useMemo, useState } from "react";
import {
  createCreditOption,
  deleteCreditOption,
  getAllCreditOptionsAdmin,
  updateCreditOption,
} from "../api/credit.api.js";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import "./AdminPayments.css";

const initialForm = {
  price: "",
  purchased: "",
  bonus: "",
};

const formatAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toFixed(2);
};

export default function AdminPayments() {
  const { loggedUser } = useUsers();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(initialForm);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const response = await getAllCreditOptionsAdmin();
      setPayments(response.data || []);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      showError("No se pudo cargar el listado de pagos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const openCreateModal = () => {
    setEditingPayment(null);
    setForm(initialForm);
    setIsModalOpen(true);
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setForm({
      price: formatAmount(payment.price),
      purchased: formatAmount(payment.purchased),
      bonus: formatAmount(payment.bonus),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setForm(initialForm);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const price = Number(form.price);
    const purchased = Number(form.purchased);
    const bonus = Number(form.bonus);

    if (Number.isNaN(price) || price <= 0) {
      showError("El campo precio debe ser mayor a 0");
      return false;
    }

    if (Number.isNaN(purchased) || purchased <= 0) {
      showError("El campo purchased debe ser mayor a 0");
      return false;
    }

    if (Number.isNaN(bonus) || bonus < 0) {
      showError("El campo bonus debe ser mayor o igual a 0");
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!loggedUser?.id || loggedUser.role !== "admin") {
      showError("Solo un administrador puede gestionar pagos");
      return;
    }

    if (!validateForm()) {
      return;
    }

    const payload = {
      price: Number(form.price).toFixed(2),
      purchased: Number(form.purchased).toFixed(2),
      bonus: Number(form.bonus).toFixed(2),
    };

    try {
      if (editingPayment) {
        await updateCreditOption(editingPayment.id, payload, loggedUser.id);
        showSuccess("Pago actualizado exitosamente");
      } else {
        await createCreditOption(payload, loggedUser.id);
        showSuccess("Pago creado exitosamente");
      }

      closeModal();
      loadPayments();
    } catch (error) {
      console.error("Error al guardar pago:", error);
      showError(error.response?.data?.message || "Error al guardar el pago");
    }
  };

  const handleDelete = (payment) => {
    if (!loggedUser?.id || loggedUser.role !== "admin") {
      showError("Solo un administrador puede gestionar pagos");
      return;
    }

    showConfirm(
      `¿Eliminar el pago con precio Bs ${formatAmount(payment.price)}?`,
      async () => {
        try {
          await deleteCreditOption(payment.id, loggedUser.id);
          showSuccess("Pago eliminado exitosamente");
          loadPayments();
        } catch (error) {
          console.error("Error al eliminar pago:", error);
          showError(
            error.response?.data?.message || "Error al eliminar el pago",
          );
        }
      },
    );
  };

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return payments;

    return payments.filter((payment) => {
      const statusText = Number(payment.status) === 1 ? "activo" : "inactivo";
      const adminName =
        `${payment.userName || ""} ${payment.userLastName || ""}`
          .trim()
          .toLowerCase();

      return (
        String(payment.id).includes(term) ||
        String(payment.price).toLowerCase().includes(term) ||
        String(payment.purchased).toLowerCase().includes(term) ||
        String(payment.bonus).toLowerCase().includes(term) ||
        statusText.includes(term) ||
        adminName.includes(term)
      );
    });
  }, [payments, search]);

  return (
    <div className="dashboard-container">
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar pagos..."
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="text-light fw-semibold">Administrador - Pagos</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      <div className="filters-section">
        <button className="btn-add-payment" onClick={openCreateModal}>
          <i className="bi bi-plus-circle"></i> Nuevo Pago
        </button>
      </div>

      <section className="table-section">
        {loading ? (
          <div className="loading-message">
            <i className="bi bi-arrow-clockwise"></i>
            Cargando pagos...
          </div>
        ) : (
          <table className="payments-table">
            <thead>
              <tr>
                <th>Precio</th>
                <th>Comprado</th>
                <th>Bono</th>
                <th>Estado</th>
                <th>Admin</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>Bs. {formatAmount(payment.price)}</td>
                    <td>{formatAmount(payment.purchased)}</td>
                    <td>{formatAmount(payment.bonus)}</td>
                    <td>
                      <span
                        className={`payment-status ${
                          Number(payment.status) === 1
                            ? "status-active"
                            : "status-inactive"
                        }`}
                      >
                        {Number(payment.status) === 1 ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td>
                      {payment.userName
                        ? `${payment.userName} ${payment.userLastName || ""}`
                        : "Sin registro"}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="action-btn edit-btn"
                        onClick={() => openEditModal(payment)}
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(payment)}
                        title="Eliminar"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center">
                    {search
                      ? "No se encontraron pagos con ese filtro"
                      : "No hay pagos registrados"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-header">
              <h3 id="modal-title" className="modal-title">
                {editingPayment ? "Editar Pago" : "Crear Nuevo Pago"}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="price">Price *</label>
                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0.01"
                    max="999.99"
                    step="0.01"
                    className="form-control"
                    value={form.price}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="purchased">Purchased *</label>
                  <input
                    id="purchased"
                    name="purchased"
                    type="number"
                    min="0.01"
                    max="999.99"
                    step="0.01"
                    className="form-control"
                    value={form.purchased}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="bonus">Bonus *</label>
                  <input
                    id="bonus"
                    name="bonus"
                    type="number"
                    min="0"
                    max="999.99"
                    step="0.01"
                    className="form-control"
                    value={form.bonus}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" className="btn-save">
                  {editingPayment ? "Actualizar" : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
