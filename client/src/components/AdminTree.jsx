import { useEffect, useState } from "react";
import {
  getAllTreesForAdminRequest,
  setTreeStateToActive,
  setTreeStateToInactive,
} from "../api/tree.api.js"; // Asegúrate de que estas funciones estén configuradas
import { useNotification } from "../context/NotificationContext.jsx";
import ViewDetailsModal from "../components/ViewDetailsModal.jsx";
import "./AdminTree.css"; // Asegúrate de que este archivo esté configurado

export default function AdminTree() {
  const { showSuccess, showError, showConfirm } = useNotification();
  const [trees, setTrees] = useState([]); // Estado para almacenar los árboles
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // Estado para abrir/cerrar el modal de detalles
  const [selectedTree, setSelectedTree] = useState(null); // Estado para el árbol seleccionado
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [search, setSearch] = useState("");

  // Obtener todos los árboles sin importar su status
  useEffect(() => {
    async function fetchTrees() {
      try {
        const response = await getAllTreesForAdminRequest(); // Llama a la API para obtener todos los árboles
        setTrees(response.data); // Almacena los árboles en el estado
      } catch (error) {
        console.error("Error al obtener los árboles:", error);
        showError("Error al cargar los árboles. Inténtalo nuevamente.");
      }
    }

    fetchTrees(); // Llama a la función para obtener los árboles al cargar el componente
  }, []); // Solo se ejecuta una vez cuando el componente se monta

  // Función para ver los detalles del árbol
  const handleViewTreeDetails = (tree) => {
    setSelectedTree(tree); // Establece el árbol seleccionado
    setIsDetailsModalOpen(true); // Abre el modal
  };

  // Función para cerrar el modal
  const closeDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedTree(null); // Limpia el árbol seleccionado cuando se cierra el modal
  };

  // Cambiar el estado del árbol a 1 (activo)
  const handleSetTreeActive = async (id) => {
    const tree = trees.find((t) => t.id === id);
    const treeInfo = tree ? tree.name : "este árbol";

    showConfirm(
      `¿Estás seguro de que deseas activar ${treeInfo}?`,
      async () => {
        try {
          const response = await setTreeStateToActive(id);
          if (response.status === 200) {
            // Recarga toda la lista de árboles
            const refreshed = await getTreesRequest();
            setTrees(refreshed.data);
            showSuccess("Árbol activado exitosamente");
            console.log("Árbol activado y lista refrescada.");
          }
        } catch (error) {
          console.error("Error al activar el árbol:", error);
          showError("Error al activar el árbol. Inténtalo nuevamente.");
        }
      },
    );
  };

  // Cambiar el estado del árbol a 0 (inactivo)
  const handleSetTreeInactive = async (id) => {
    const tree = trees.find((t) => t.id === id);
    const treeInfo = tree ? tree.name : "este árbol";

    showConfirm(
      `¿Estás seguro de que deseas desactivar ${treeInfo}?`,
      async () => {
        try {
          const response = await setTreeStateToInactive(id);
          if (response.status === 200) {
            // Recarga toda la lista de árboles
            const refreshed = await getTreesRequest();
            setTrees(refreshed.data);
            showSuccess("Árbol desactivado exitosamente");
            console.log("Árbol desactivado y lista refrescada.");
          }
        } catch (error) {
          console.error("Error al desactivar el árbol:", error);
          showError("Error al desactivar el árbol. Inténtalo nuevamente.");
        }
      },
    );
  };

  // Filtrado por búsqueda
  const filteredTrees = trees.filter((tree) => {
    const matchesSearch =
      tree.userName.toLowerCase().includes(search.toLowerCase()) ||
      tree.userLastName.toLowerCase().includes(search.toLowerCase()) ||
      tree.name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredTrees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTrees = filteredTrees.slice(startIndex, endIndex);

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

  // Resetear página cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  return (
    <div className="dashboard-container">
      {/* Header */}
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
          <span className="admin-text">Administrador - Árboles</span>
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
            <input type="date" className="date-input" />
          </div>
          <div className="date-input-group">
            <label>Fecha Fin</label>
            <input type="date" className="date-input" />
          </div>
        </div>
      </div>

      {/* Tabla de árboles */}
      <section className="table-section">
        <table className="trees-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellidos</th>
              <th>Fecha de Registro</th>
              <th>Árbol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentTrees.map((tree, index) => (
              <tr key={tree.id || index}>
                <td>
                  <div className="tree-cell">{tree.userName}</div>
                </td>
                <td>{tree.userLastName}</td>
                <td>{new Date(tree.registerDate).toLocaleDateString()}</td>
                <td>{tree.name}</td>
                <td>
                  <span className={`status-badge status-${tree.status}`}>
                    {tree.status === 0
                      ? "Inactivo"
                      : tree.status === 1
                        ? "Activo"
                        : tree.status === 2
                          ? "Pendiente"
                          : "Desconocido"}
                  </span>
                </td>
                <td className="actions-cell">
                  <button
                    className="action-btn view-btn"
                    onClick={() => handleViewTreeDetails(tree)} // Ver detalles del árbol
                  >
                    <i className="bi bi-eye-fill"></i>
                  </button>
                  <button
                    className="action-btn check-btn"
                    onClick={() => handleSetTreeActive(tree.id)} // Activar árbol
                  >
                    <i className="bi bi-check-lg"></i>
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleSetTreeInactive(tree.id)} // Desactivar árbol
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

      {/* Modal para ver detalles del árbol */}
      <ViewDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={closeDetailsModal}
        data={selectedTree}
        type="tree"
      />
    </div>
  );
}
