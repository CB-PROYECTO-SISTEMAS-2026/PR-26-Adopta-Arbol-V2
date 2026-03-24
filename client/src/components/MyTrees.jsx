import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import { getMyTrees, renameTree, abandonTree } from "../api/tree.api";
import { getTreeIrrigationEvidenceRequest } from "../api/irrigation.api";
import { getStaticUrl } from "../config/api.config.js";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Card from "./Card";
import "./MyTrees.css";
import "./ViewDetailsModal.css";
import "./IrrigatorMap.css";
import "./TreeHome.css";

const IRRIGATION_DISCOUNT_RATE = 0.2;

const toNumeric = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const getIrrigationPricing = (price) => {
  const original = toNumeric(price);
  const discounted =
    Math.round(original * (1 - IRRIGATION_DISCOUNT_RATE) * 100) / 100;
  const discountAmount =
    Math.round(original * IRRIGATION_DISCOUNT_RATE * 100) / 100;

  return {
    original,
    discounted,
    discountAmount,
  };
};

const formatPoints = (value) => {
  const numeric = toNumeric(value);

  const formatter = new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(numeric);
};

// Configurar iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

export default function MyTrees() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } =
    useNotification();

  const [myTrees, setMyTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingTree, setEditingTree] = useState(null);
  const [newTreeName, setNewTreeName] = useState("");
  const [selectedTree, setSelectedTree] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBuyCreditsModal, setShowBuyCreditsModal] = useState(false);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [treeIrrigationEvidence, setTreeIrrigationEvidence] = useState({});

  useEffect(() => {
    loadMyTrees();
  }, []);

  const loadMyTrees = async () => {
    try {
      setLoading(true);
      // Agregar el ID del usuario a los headers
      const response = await getMyTrees(loggedUser?.id);
      setMyTrees(response.data);

      // Cargar evidencia de riego para cada árbol
      const evidenceMap = {};
      for (const tree of response.data) {
        try {
          const evidenceResponse = await getTreeIrrigationEvidenceRequest(
            tree.id,
          );
          if (evidenceResponse.data && evidenceResponse.data.length > 0) {
            evidenceMap[tree.id] = evidenceResponse.data[0]; // Guardar la primera evidencia
          }
        } catch (error) {
          console.warn(
            `No se pudo cargar evidencia para árbol ${tree.id}:`,
            error,
          );
          // Continuar sin evidencia para este árbol
        }
      }
      setTreeIrrigationEvidence(evidenceMap);
    } catch (error) {
      console.error("Error al cargar mis árboles:", error);
      // En caso de error, mostrar mensaje al usuario
      showError("Error al cargar tus árboles. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    showConfirm("¿Estás seguro de que quieres cerrar sesión?", () => {
      logout();
      window.location.replace("/");
    });
  };

  const goToRanking = () => {
    navigate("/ranking");
  };

  const goBack = () => {
    navigate("/home");
  };

  const handleWaterTree = (treeId) => {
    navigate(`/irrigate-tree/${treeId}`);
  };

  const handleViewDetails = (treeId) => {
    const tree = myTrees.find((t) => t.id === treeId);
    if (tree) {
      setSelectedTree(tree);
      setShowDetailsModal(true);
    }
  };

  const handleDeleteTree = async (treeId) => {
    showConfirm(
      "¿Estás seguro de que quieres abandonar este árbol? Esto lo pondrá disponible para otros usuarios.",
      async () => {
        try {
          await abandonTree(treeId, loggedUser?.id);
          // Recargar la lista de árboles
          loadMyTrees();
          showSuccess("Árbol abandonado exitosamente");
        } catch (error) {
          console.error("Error al abandonar árbol:", error);
          showError("Error al abandonar el árbol. Intenta nuevamente.");
        }
      },
    );
  };

  const handleRenameTree = (tree) => {
    setEditingTree(tree);
    setNewTreeName(tree.name);
  };

  const handleSaveRename = async () => {
    if (newTreeName.trim()) {
      try {
        await renameTree(editingTree.id, newTreeName.trim(), loggedUser?.id);
        // Actualizar la lista local
        setMyTrees((prevTrees) =>
          prevTrees.map((tree) =>
            tree.id === editingTree.id
              ? { ...tree, name: newTreeName.trim() }
              : tree,
          ),
        );
        setEditingTree(null);
        setNewTreeName("");
        showSuccess("Nombre del árbol actualizado exitosamente");
      } catch (error) {
        console.error("Error al renombrar árbol:", error);
        showError("Error al cambiar el nombre del árbol. Intenta nuevamente.");
      }
    }
  };

  const handleCancelRename = () => {
    setEditingTree(null);
    setNewTreeName("");
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTree(null);
  };

  const handleVisitTree = () => {
    if (!selectedTree) return;

    const { latitude, longitude, name, address } = selectedTree;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    window.open(mapsUrl, "_blank");
  };

  const filteredTrees = myTrees.filter((tree) =>
    tree.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="mytrees-container">
        <div className="loading">Cargando mis árboles...</div>
      </div>
    );
  }

  const selectedTreePricing = selectedTree
    ? getIrrigationPricing(selectedTree.price)
    : null;

  return (
    <div className="treehome-container">
      {/* Navbar igual a TreeHome */}
      <nav className="map-navbar">
        <div className="navbar-container">
          <button className="btn-back-map" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>

          <div className="navbar-center">
            <span className="navbar-greeting">
              BIENVENIDO {loggedUser?.name || loggedUser?.username || "Usuario"}
            </span>
          </div>

          <div className="navbar-actions">
            <button
              className="btn-hamburger"
              onClick={() => setShowNavMenu(!showNavMenu)}
              aria-label="Menú"
            >
              <i className={showNavMenu ? "bi bi-x-lg" : "bi bi-list"}></i>
            </button>

            <div className="user-icon-container">
              <div
                className="user-icon"
                onClick={() => setShowLogoutCard(!showLogoutCard)}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
              {showLogoutCard && (
                <div className="logout-card">
                  <div className="logout-card-info">
                    <div className="navbar-points">
                      <span className="points-icon">⭐</span>
                      <span className="points-amount">
                        {loggedUser?.point || 0}
                      </span>
                    </div>
                    <div className="navbar-credits">
                      <i className="bi bi-currency-dollar"></i>
                      <span>{loggedUser?.credits || 0}</span>
                    </div>
                  </div>
                  <button className="logout-card-button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menú desplegable */}
        {showNavMenu && (
          <div className="navbar-menu">
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/tree-home");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-map-fill"></i>
              <span>Mapa de Árboles</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/user-buy-credits");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-cart-fill"></i>
              <span>Comprar Créditos</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/ranking");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking</span>
            </button>
          </div>
        )}
      </nav>

      {/* MyTrees Container */}
      <div className="mytrees-content">
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search for anything..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Trees Grid */}
        <div className="trees-grid">
          {filteredTrees.length === 0 ? (
            <div className="no-trees">
              <p>No tienes árboles adoptados aún</p>
              <button className="btn-primary" onClick={() => navigate("/home")}>
                Adoptar Árboles
              </button>
            </div>
          ) : (
            filteredTrees.map((tree) => {
              const pricing = getIrrigationPricing(tree.price);
              const hasPrice = pricing.original > 0;

              return (
                <div key={tree.id} className="tree-card">
                  {/* Tree Image */}
                  <div className="tree-image">
                    {treeIrrigationEvidence[tree.id]?.evidence ? (
                      // Mostrar foto de riego si está disponible
                      <img
                        src={getStaticUrl(
                          `/evidence/${treeIrrigationEvidence[tree.id].evidence}`,
                        )}
                        alt={`Evidencia de riego - ${tree.name}`}
                        onError={(e) => {
                          // Si la foto de riego falla, intentar mostrar la imagen del árbol
                          if (tree.imagePath) {
                            e.target.src = getStaticUrl(tree.imagePath);
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    ) : tree.imagePath ? (
                      <img
                        src={getStaticUrl(tree.imagePath)}
                        alt={tree.name}
                        onError={(e) => {
                          e.target.src = "/default-tree.svg";
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <span className="tree-icon">🌳</span>
                      </div>
                    )}
                  </div>

                  {/* Tree Name */}
                  <div className="tree-name">
                    {editingTree?.id === tree.id ? (
                      <div className="rename-container">
                        <input
                          type="text"
                          value={newTreeName}
                          onChange={(e) => setNewTreeName(e.target.value)}
                          className="rename-input"
                          autoFocus
                        />
                        <div className="rename-buttons">
                          <button
                            className="save-btn"
                            onClick={handleSaveRename}
                            disabled={!newTreeName.trim()}
                          >
                            ✓
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={handleCancelRename}
                          >
                            ✗
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="name-container">
                        <div className="name-and-status">
                          <h3>{tree.name}</h3>
                          <span
                            className={`status-indicator ${tree.adoptionStatus === 1 ? "approved" : "pending"}`}
                          >
                            {tree.adoptionStatus === 1
                              ? "✅ Aprobado"
                              : "⏳ Pendiente"}
                          </span>
                        </div>
                        {tree.adoptionStatus === 1 && (
                          <button
                            className="edit-name-btn"
                            onClick={() => handleRenameTree(tree)}
                            title="Cambiar nombre"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="action-buttons">
                    {tree.adoptionStatus === 1 ? (
                      // Adopción aprobada - mostrar todas las acciones
                      <>
                        <button
                          className="btn-water"
                          onClick={() => handleWaterTree(tree.id)}
                        >
                          REGAR
                        </button>
                        <button
                          className="btn-details"
                          onClick={() => handleViewDetails(tree.id)}
                        >
                          DETALLES
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteTree(tree.id)}
                        >
                          ELIMINAR
                        </button>
                      </>
                    ) : (
                      // Adopción pendiente - mostrar solo detalles
                      <>
                        <button className="btn-pending" disabled>
                          PENDIENTE
                        </button>
                        <button
                          className="btn-details"
                          onClick={() => handleViewDetails(tree.id)}
                        >
                          DETALLES
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteTree(tree.id)}
                        >
                          CANCELAR
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal de Detalles */}
        {showDetailsModal && selectedTree && (
          <div className="modal-overlay" onClick={closeDetailsModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={closeDetailsModal}>
                ×
              </button>

              <div className="details-header">
                <h2>Detalles del Árbol</h2>
              </div>

              <div className="details-content">
                {/* Información del árbol */}
                <div className="tree-info-section">
                  <div className="tree-image-large">
                    {selectedTree.imagePath ? (
                      <img
                        src={getStaticUrl(selectedTree.imagePath)}
                        alt={`Imagen del árbol ${selectedTree.name}`}
                        onError={(e) => {
                          console.error(
                            "Error al cargar imagen:",
                            e.target.src,
                          );
                          e.target.src = "/default-tree.svg";
                          e.target.alt = "Imagen por defecto del árbol";
                        }}
                      />
                    ) : (
                      <div className="no-image-placeholder">
                        <div className="tree-icon-large">🌳</div>
                        <p>Sin imagen disponible</p>
                      </div>
                    )}
                  </div>

                  <div className="tree-details-info">
                    <div className="detail-item">
                      <span className="label">Nombre:</span>
                      <span className="value">{selectedTree.name}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Descripción:</span>
                      <span className="value">
                        {selectedTree.description || "Sin descripción"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Dirección:</span>
                      <span className="value">
                        {selectedTree.address || "Sin dirección"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Precio:</span>
                      <span className="value">
                        <span className="price-original-inline">
                          {formatPoints(
                            selectedTreePricing?.original ?? selectedTree.price,
                          )}{" "}
                          pts
                        </span>
                      </span>
                    </div>
                    {selectedTreePricing &&
                      selectedTreePricing.original > 0 && (
                        <div className="detail-item">
                          <span className="label">
                            Costo para regador (-20%):
                          </span>
                          <span className="value value--discount">
                            <span className="price-discounted">
                              {formatPoints(selectedTreePricing.discounted)} pts
                            </span>
                            <span className="price-saving">
                              Ahorro de{" "}
                              {formatPoints(selectedTreePricing.discountAmount)}{" "}
                              pts frente al costo base.
                            </span>
                          </span>
                        </div>
                      )}
                    <div className="detail-item">
                      <span className="label">Estado:</span>
                      <span
                        className={`status-badge status-${selectedTree.adoptionStatus}`}
                      >
                        {selectedTree.adoptionStatus === 1
                          ? "✅ Aprobado"
                          : "⏳ Pendiente"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mapa */}
                <div className="map-section">
                  <h3>Ubicación</h3>
                  {selectedTree.latitude && selectedTree.longitude ? (
                    <div className="tree-map">
                      <MapContainer
                        center={[
                          parseFloat(selectedTree.latitude),
                          parseFloat(selectedTree.longitude),
                        ]}
                        zoom={15}
                        style={{
                          height: "300px",
                          width: "100%",
                          borderRadius: "10px",
                        }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker
                          position={[
                            parseFloat(selectedTree.latitude),
                            parseFloat(selectedTree.longitude),
                          ]}
                        >
                          <Popup>
                            <div className="tree-popup">
                              <h4>{selectedTree.name}</h4>
                              <p>
                                <strong>Dirección:</strong>{" "}
                                {selectedTree.address}
                              </p>
                              <p>
                                <strong>Precio:</strong>{" "}
                                {formatPoints(
                                  selectedTreePricing?.original ??
                                    selectedTree.price,
                                )}{" "}
                                pts
                              </p>
                              {selectedTreePricing &&
                                selectedTreePricing.original > 0 && (
                                  <p>
                                    <strong>Regador (-20%):</strong>{" "}
                                    {formatPoints(
                                      selectedTreePricing.discounted,
                                    )}{" "}
                                    pts
                                  </p>
                                )}
                            </div>
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  ) : (
                    <div className="no-coordinates">
                      <p>⚠️ No se encontraron coordenadas para este árbol</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="modal-actions">
                  <button className="btn-visit" onClick={handleVisitTree}>
                    🗺️ Visitar en Google Maps
                  </button>
                  <button className="btn-close" onClick={closeDetailsModal}>
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Compra de Créditos */}
        {showBuyCreditsModal && (
          <Card onClose={() => setShowBuyCreditsModal(false)} />
        )}

        {/* Footer */}
        <footer className="mytrees-footer">
          <p>© 2025 Adopta, todos los derechos reservados.</p>
        </footer>
      </div>
    </div>
  );
}
