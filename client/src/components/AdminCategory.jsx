import { useEffect, useState } from "react";
import axios from "axios";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import ViewDetailsModal from "../components/ViewDetailsModal.jsx";
import "./AdminCategory.css";

import { API_URL } from "../config/api.config.js";

export default function AdminCategory() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryName, setCategoryName] = useState("");
  const [search, setSearch] = useState("");

  const { loggedUser } = useUsers();
  const { showSuccess, showError, showConfirm } = useNotification();

  // Cargar categorías al montar el componente
  useEffect(() => {
    loadCategories();
  }, []);

  // Función para cargar categorías
  const loadCategories = async () => {
    setLoading(true);
    try {
      console.log("Cargando categorías...");
      const response = await axios.get(`${API_URL}/categories`);
      console.log("Respuesta de la API:", response.data);
      setCategories(response.data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      showError("Error al cargar las categorías");
    } finally {
      setLoading(false);
    }
  };

  // Función para abrir el modal de creación
  const openCreateModal = () => {
    setCategoryName("");
    setIsModalOpen(true);
  };

  // Función para cerrar el modal de creación
  const closeCreateModal = () => {
    setIsModalOpen(false);
    setCategoryName("");
  };

  // Función para ver los detalles de la categoría
  const viewCategoryDetails = (category) => {
    console.log("Ver detalles de categoría:", category);
    setSelectedCategory(category);
    setIsDetailsModalOpen(true);
  };

  // Función para cerrar el modal de detalles
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCategory(null);
  };

  // Función para crear una categoría
  const createCategory = async (e) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      showError("El nombre de la categoría es requerido");
      return;
    }

    if (!loggedUser?.id) {
      showError("Debes estar logueado para realizar esta acción");
      return;
    }

    try {
      const categoryData = {
        name: categoryName.trim(),
        userId: loggedUser.id,
      };

      console.log("Creando categoría:", categoryData);
      await axios.post(`${API_URL}/categories`, categoryData);
      
      showSuccess("Categoría creada exitosamente");
      closeCreateModal();
      loadCategories();
    } catch (error) {
      console.error("Error al crear categoría:", error);
      showError("Error al crear la categoría: " + (error.response?.data?.message || error.message));
    }
  };

  // Función para eliminar una categoría
  const deleteCategory = async (id) => {
    if (!loggedUser?.id) {
      showError("Debes estar logueado para realizar esta acción");
      return;
    }

    showConfirm(
      "¿Estás seguro de que deseas eliminar esta categoría?",
      async () => {
        try {
          console.log("Eliminando categoría:", id);
          await axios.delete(`${API_URL}/categories/${id}`, {
            data: { userId: loggedUser.id }
          });
          
          showSuccess("Categoría eliminada exitosamente");
          loadCategories();
        } catch (error) {
          console.error("Error al eliminar categoría:", error);
          showError("Error al eliminar la categoría: " + (error.response?.data?.message || error.message));
        }
      }
    );
  };

  // Filtrado por búsqueda
  const filteredCategories = categories.filter((category) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      category.name?.toLowerCase().includes(searchLower) ||
      category.userName?.toLowerCase().includes(searchLower) ||
      category.userLastName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="admin-header">
        <div className="search-section">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar categorías..."
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <i className="bi bi-search search-icon"></i>
          </div>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador - Categorías</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </div>

      {/* Botón de agregar */}
      <div className="filters-section">
        <button className="btn-add-category" onClick={openCreateModal}>
          <i className="bi bi-plus-circle"></i> Agregar Categoría
        </button>
      </div>

      {/* Tabla de categorías */}
      <section className="table-section">
        {loading ? (
          <div className="loading-message">
            <i className="bi bi-arrow-clockwise"></i>
            Cargando categorías...
          </div>
        ) : (
          <table className="categories-table">
            <thead>
              <tr>
                <th>Categoría</th>
            
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-name">
                        {category.name}
                      </div>
                    </td>
                    
                    <td className="actions-cell">
                     
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteCategory(category.id)}
                        title="Eliminar"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center">
                    {search ? "No se encontraron categorías con ese filtro" : "No hay categorías disponibles"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      {/* Modal para crear categoría */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crear Nueva Categoría</h3>
              <button className="modal-close" onClick={closeCreateModal}>
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={createCategory}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="categoryName">Nombre de la Categoría *</label>
                  <input
                    type="text"
                    id="categoryName"
                    className="form-control"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Ingrese el nombre de la categoría"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeCreateModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Crear Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para ver detalles de la categoría */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        data={selectedCategory}
        type="category"
      />
    </div>
  );
}
