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
          <div className="navbar-center"></div>

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
                      <img
                        src="/StartCoin.svg"
                        alt="points"
                        className="points-icon"
                        style={{ width: "24px", height: "24px" }}
                      />
                      <span className="points-amount">
                        {loggedUser?.point || 0}
                      </span>
                    </div>
                    <div className="navbar-credits">
                      <img
                        src="/DollarCoin.svg"
                        alt="credits"
                        className="credits-icon"
                        style={{ width: "24px", height: "24px" }}
                      />
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
              return (
                <div key={tree.id} className="tree-card">
                  {/* Tree Image */}
                  <div className="tree-image">
                    <div className="tree-card-top-actions">
                      <button
                        className="btn-details-top"
                        onClick={() => handleViewDetails(tree.id)}
                        aria-label={`Ver detalles de ${tree.name}`}
                      >
                        <i className="bi bi-eye-fill"></i>
                        <span>Detalles</span>
                      </button>
                      <button
                        className="btn-edit-top"
                        onClick={() => handleRenameTree(tree)}
                        disabled={tree.adoptionStatus !== 1}
                        aria-label={`Editar nombre de ${tree.name}`}
                        title="Cambiar nombre"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                    </div>

                    {tree.imagePath ? (
                      <img
                        src={getStaticUrl(tree.imagePath)}
                        alt={`Imagen de ${tree.name}`}
                        onError={(e) => {
                          if (treeIrrigationEvidence[tree.id]?.evidence) {
                            e.target.src = getStaticUrl(
                              `/evidence/${treeIrrigationEvidence[tree.id].evidence}`,
                            );
                          } else {
                            e.target.style.display = "none";
                          }
                        }}
                      />
                    ) : treeIrrigationEvidence[tree.id]?.evidence ? (
                      <img
                        src={getStaticUrl(
                          `/evidence/${treeIrrigationEvidence[tree.id].evidence}`,
                        )}
                        alt={tree.name}
                        onError={(e) => {
                          e.target.src = "/default-tree.svg";
                        }}
                      />
                    ) : (
                      <div className="image-placeholder">
                        <img
                          src="/StartCoin.svg"
                          alt="coin"
                          className="tree-icon"
                          style={{ width: "28px", height: "28px" }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="my-tree-card-content">
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
                            Guardar
                          </button>
                          <button
                            className="cancel-btn"
                            onClick={handleCancelRename}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="tree-card-header">
                        <h3 className="tree-card-title">{tree.name}</h3>
                        <p
                          className={`tree-card-subtitle ${tree.adoptionStatus === 1 ? "approved" : "pending"}`}
                        >
                          {tree.adoptionStatus === 1 ? "Aprobado" : "Pendiente"}
                        </p>
                        <p className="tree-card-address">
                          {tree.address || "Sin dirección registrada."}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      <button
                        className="btn-water"
                        onClick={() => handleWaterTree(tree.id)}
                        disabled={tree.adoptionStatus !== 1}
                      >
                        Regar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteTree(tree.id)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal de Detalles */}
        {showDetailsModal && selectedTree && (
          <div className="mytrees-details-overlay" onClick={closeDetailsModal}>
            <div
              className="mytrees-details-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mytrees-details-close"
                onClick={closeDetailsModal}
              >
                ×
              </button>

              <div className="mytrees-image-large">
                {selectedTree.imagePath ? (
                  <img
                    src={getStaticUrl(selectedTree.imagePath)}
                    alt={`Imagen del árbol ${selectedTree.name}`}
                    onError={(e) => {
                      console.error("Error al cargar imagen:", e.target.src);
                      e.target.src = "/default-tree.svg";
                      e.target.alt = "Imagen por defecto del árbol";
                    }}
                  />
                ) : (
                  <div className="mytrees-no-image-placeholder">
                    <div className="mytrees-tree-icon-large">🌳</div>
                    <p>Sin imagen disponible</p>
                  </div>
                )}
              </div>

              <div className="mytrees-details-header">
                <h2>Detalles del Árbol</h2>
              </div>

              <div className="mytrees-details-content">
                <div className="mytrees-tree-details-info">
                  <div className="mytrees-detail-item">
                    <span className="mytrees-label">Nombre</span>
                    <span className="mytrees-text">{selectedTree.name}</span>
                  </div>
                  <div className="mytrees-detail-item">
                    <span className="mytrees-label">Descripción</span>
                    <span className="mytrees-text">
                      {selectedTree.description || "Sin descripción"}
                    </span>
                  </div>
                  <div className="mytrees-detail-item">
                    <span className="mytrees-label">Dirección</span>
                    <span className="mytrees-text">
                      {selectedTree.address || "Sin dirección"}
                    </span>
                  </div>
                  <div className="mytrees-detail-item">
                    <span className="mytrees-label">Precio</span>
                    <span className="mytrees-text">
                      {formatPoints(
                        selectedTreePricing?.original ?? selectedTree.price,
                      )}{" "}
                      pts
                    </span>
                  </div>
                  {selectedTreePricing && selectedTreePricing.original > 0 && (
                    <div className="mytrees-detail-item">
                      <span className="mytrees-label">
                        Costo para regador (-20%)
                      </span>
                      <span className="mytrees-text">
                        {formatPoints(selectedTreePricing.discounted)} pts
                      </span>
                    </div>
                  )}
                  <div className="mytrees-detail-item">
                    <span className="mytrees-label">Estado</span>
                    <span className="mytrees-text">
                      {selectedTree.adoptionStatus === 1
                        ? "Aprobado"
                        : "Pendiente"}
                    </span>
                  </div>
                </div>

                {/* Mapa */}
                <div className="mytrees-map-section">
                  <h3 className="mytrees-map-title">
                    <i className="bi bi-geo-alt-fill"></i>
                    <span>Ubicación</span>
                  </h3>
                  {selectedTree.latitude && selectedTree.longitude ? (
                    <div className="mytrees-tree-map">
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
                    <div className="mytrees-no-coordinates">
                      <p>⚠️ No se encontraron coordenadas para este árbol</p>
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                <div className="mytrees-modal-actions">
                  <button
                    className="mytrees-btn-visit"
                    onClick={handleVisitTree}
                  >
                    <i className="bi bi-geo-alt"></i>
                    <span>Visitar en Google Maps</span>
                  </button>
                  <button
                    className="mytrees-btn-close"
                    onClick={closeDetailsModal}
                  >
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
      </div>
    </div>
  );
}
