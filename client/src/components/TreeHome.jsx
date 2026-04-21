import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import { getAllTreesWithAdoptionStatus, getTreeHistory } from "../api/tree.api";
import { createAdoptionRequest } from "../api/adoption.api";
import { getUserQr } from "../api/redemption.api";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { getUnreadNotificationsRequest } from "../api/notification.api";
import { getStaticUrl } from "../config/api.config.js";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./TreeHome.css";
import "./IrrigatorMap.css";
import NotificationsPanel from "./NotificationsPanel";

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

// Iconos personalizados para árboles
const createTreeIcon = (isAdopted) => {
  let markerClass, statusText;

  if (isAdopted === 1) {
    // Adoptado
    markerClass = "is-adopted";
    statusText = "Adoptado";
  } else if (isAdopted === 2) {
    // Pendiente de confirmación
    markerClass = "is-pending";
    statusText = "Pendiente";
  } else {
    // Disponible
    markerClass = "is-available";
    statusText = "Disponible";
  }

  return L.divIcon({
    html: `<div class="treehome-marker ${markerClass}" title="${statusText}">
      <div class="treehome-marker-core">
        <i class="bi bi-tree-fill" aria-hidden="true"></i>
      </div>
    </div>`,
    className: "custom-tree-icon",
    iconSize: [34, 44],
    iconAnchor: [17, 40],
    popupAnchor: [0, -34],
  });
};

export default function TreeHome() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const { showConfirm } = useNotification();

  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [treeHistory, setTreeHistory] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [historyImageIndex, setHistoryImageIndex] = useState(0);

  const getTreeStatusLabel = (status) => {
    switch (Number(status)) {
      case 0:
        return "Inactivo";
      case 1:
        return "Activo";
      case 2:
        return "Pendiente";
      default:
        return "Desconocido";
    }
  };

  useEffect(() => {
    loadTrees(true); // Carga inicial con loading
    loadUnreadNotifications(); // Cargar notificaciones no leídas

    // Refrescar datos cada 30 segundos sin mostrar loading
    const interval = setInterval(() => {
      loadTrees(false); // Refresco silencioso
      loadUnreadNotifications(); // Refrescar contador de notificaciones
    }, 30000); // 30 segundos

    // Prevenir navegación hacia atrás después del logout
    const handleBeforeUnload = (e) => {
      // Si el usuario intenta salir, limpiar la sesión
      logout();
    };

    const handlePopState = (e) => {
      // Si el usuario usa el botón atrás, verificar si está autenticado
      if (!loggedUser) {
        e.preventDefault();
        window.location.replace("/");
      }
    };

    // Agregar event listeners
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    // Limpiar el interval y event listeners cuando el componente se desmonte
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loggedUser]);

  const loadTrees = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await getAllTreesWithAdoptionStatus();
      setTrees(response.data);
    } catch (error) {
      console.error("Error al cargar árboles:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadUnreadNotifications = async () => {
    if (!loggedUser?.id) return;

    try {
      const response = await getUnreadNotificationsRequest(loggedUser.id);
      setUnreadNotificationsCount(response.count || 0);
    } catch (error) {
      console.error("Error al cargar notificaciones no leídas:", error);
    }
  };

  const goToRanking = () => {
    navigate("/ranking");
  };

  const goToBuyCredits = () => {
    navigate("/user-buy-credits");
  };

  const goToMyTrees = () => {
    navigate("/my-trees");
  };

  const handleLogout = () => {
    // Confirmar logout
    showConfirm("¿Estás seguro de que quieres cerrar sesión?", () => {
      console.log("=== INICIANDO LOGOUT DESDE TREEHOME ===");

      // Ejecutar logout del contexto
      logout();

      // Limpiar el historial del navegador para prevenir navegación hacia atrás
      window.history.replaceState(null, null, "/");

      // Forzar recarga completa de la página
      window.location.replace("/");
    });
  };

  const handleTreeClick = (tree) => {
    setSelectedTree(tree);
  };

  const handleViewHistory = async () => {
    if (!selectedTree) return;

    try {
      const response = await getTreeHistory(selectedTree.id);
      console.log("Tree History Response:", response.data);
      console.log("Tree Image Paths:", response.data.tree?.imagePaths);
      setTreeHistory(response.data);
      setHistoryImageIndex(0);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error al cargar historial:", error);
    }
  };

  const handleVisit = () => {
    if (!selectedTree) return;

    const { latitude, longitude, name, address } = selectedTree;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    window.open(mapsUrl, "_blank");
  };

  const handleAdopt = () => {
    if (!selectedTree) return;
    navigate(`/adopt-tree/${selectedTree.id}`);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setTreeHistory(null);
    setHistoryImageIndex(0);
  };

  const historyImages = useMemo(() => {
    if (!treeHistory?.tree?.imagePaths) return [];

    const paths = Array.isArray(treeHistory.tree.imagePaths)
      ? treeHistory.tree.imagePaths
      : [treeHistory.tree.imagePaths];

    const seen = new Set();
    const unique = [];

    paths.forEach((rawPath) => {
      if (!rawPath) return;

      const normalized = String(rawPath).trim();
      if (!normalized) return;

      const key = normalized
        .replace(/^https?:\/\/[^/]+/i, "")
        .replace(/\/{2,}/g, "/")
        .toLowerCase();

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(normalized);
      }
    });

    return unique;
  }, [treeHistory?.tree?.imagePaths]);
  const irrigationCount = treeHistory?.irrigations?.length ?? 0;
  const previousOwnersCount = treeHistory?.previousOwners?.length ?? 0;

  const { historySummaryMetrics, historySummaryDetails } = useMemo(() => {
    if (!treeHistory?.tree) {
      return { historySummaryMetrics: [], historySummaryDetails: [] };
    }

    const metrics = [];
    const details = [];

    metrics.push({
      label: "Código",
      value: treeHistory.tree.code || "N/A",
    });

    metrics.push({
      label: "Estado",
      value: getTreeStatusLabel(treeHistory.tree.status),
    });

    if (
      treeHistory.tree.price !== undefined &&
      treeHistory.tree.price !== null
    ) {
      metrics.push({
        label: "Precio",
        value: `${treeHistory.tree.price} créditos`,
      });
    }

    details.push({
      label: "Dueño actual",
      value: treeHistory.currentOwner || "Sin dueño",
    });

    if (treeHistory.tree.address) {
      details.push({
        label: "Dirección",
        value: treeHistory.tree.address,
      });
    }

    if (treeHistory.tree.registerDate) {
      details.push({
        label: "Registrado el",
        value: new Date(treeHistory.tree.registerDate).toLocaleString("es-BO", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
    }

    if (treeHistory.tree.latitude && treeHistory.tree.longitude) {
      details.push({
        label: "Coordenadas",
        value: `${Number(treeHistory.tree.latitude).toFixed(4)}, ${Number(
          treeHistory.tree.longitude,
        ).toFixed(4)}`,
      });
    }

    return {
      historySummaryMetrics: metrics,
      historySummaryDetails: details,
    };
  }, [treeHistory]);

  useEffect(() => {
    if (historyImageIndex >= historyImages.length) {
      setHistoryImageIndex(0);
    }
  }, [historyImageIndex, historyImages.length]);

  useEffect(() => {
    if (!showHistoryModal || historyImages.length <= 1) return;

    const interval = setInterval(() => {
      setHistoryImageIndex((prev) =>
        prev === historyImages.length - 1 ? 0 : prev + 1,
      );
    }, 4000);

    return () => clearInterval(interval);
  }, [showHistoryModal, historyImages.length]);

  const handlePrevHistoryImage = () => {
    if (historyImages.length <= 1) return;
    setHistoryImageIndex((prev) =>
      prev === 0 ? historyImages.length - 1 : prev - 1,
    );
  };

  const handleNextHistoryImage = () => {
    if (historyImages.length <= 1) return;
    setHistoryImageIndex((prev) =>
      prev === historyImages.length - 1 ? 0 : prev + 1,
    );
  };

  const handleSelectHistoryImage = (index) => {
    setHistoryImageIndex(index);
  };

  const buildHistoryImageUrl = (path) => {
    if (!path) return "";
    return getStaticUrl(path);
  };

  // Calcular el centro del mapa basado en los árboles
  const getMapCenter = () => {
    if (trees.length === 0) {
      return [4.6097, -74.0817]; // Bogotá por defecto
    }

    // Filtrar árboles con coordenadas válidas
    const validTrees = trees.filter(
      (tree) =>
        tree.latitude &&
        tree.longitude &&
        !isNaN(parseFloat(tree.latitude)) &&
        !isNaN(parseFloat(tree.longitude)) &&
        isFinite(tree.latitude) &&
        isFinite(tree.longitude),
    );

    if (validTrees.length === 0) {
      return [4.6097, -74.0817]; // Bogotá por defecto si no hay árboles válidos
    }

    const avgLat =
      validTrees.reduce((sum, tree) => sum + parseFloat(tree.latitude), 0) /
      validTrees.length;
    const avgLng =
      validTrees.reduce((sum, tree) => sum + parseFloat(tree.longitude), 0) /
      validTrees.length;

    return [avgLat, avgLng];
  };

  if (loading) {
    return (
      <div className="treehome-container">
        <div className="loading">Cargando árboles...</div>
      </div>
    );
  }

  return (
    <div className="treehome-container">
      {/* Navbar */}
      <nav className="map-navbar">
        <div className="navbar-container">
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
                setShowNotificationsPanel(true);
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-bell-fill"></i>
              <span>Notificaciones</span>
              {unreadNotificationsCount > 0 && (
                <span className="menu-badge">{unreadNotificationsCount}</span>
              )}
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/my-trees");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-tree-fill"></i>
              <span>Mis Árboles</span>
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

      <div className="map-container px-2">
        <h3 className="text-white mt-3">Mapa de Árboles</h3>
        {(() => {
          const validTrees = trees.filter(
            (tree) =>
              tree.latitude &&
              tree.longitude &&
              !isNaN(parseFloat(tree.latitude)) &&
              !isNaN(parseFloat(tree.longitude)) &&
              isFinite(tree.latitude) &&
              isFinite(tree.longitude),
          );

          if (validTrees.length === 0 && trees.length > 0) {
            return (
              <div className="map-error">
                <p>
                  ⚠️ No se pudieron cargar las coordenadas de los árboles.
                  Verifique que los datos estén correctos.
                </p>
              </div>
            );
          }

          return (
            <div className="trees-map">
              <MapContainer
                center={getMapCenter()}
                zoom={12}
                style={{ height: "400px", width: "100%", borderRadius: "15px" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {trees
                  .filter(
                    (tree) =>
                      tree.latitude &&
                      tree.longitude &&
                      !isNaN(parseFloat(tree.latitude)) &&
                      !isNaN(parseFloat(tree.longitude)) &&
                      isFinite(tree.latitude) &&
                      isFinite(tree.longitude),
                  )
                  .map((tree) => (
                    <Marker
                      key={tree.id}
                      position={[
                        parseFloat(tree.latitude),
                        parseFloat(tree.longitude),
                      ]}
                      icon={createTreeIcon(tree.isAdopted)}
                      eventHandlers={{
                        click: () => handleTreeClick(tree),
                      }}
                    >
                      <Popup>
                        <div className="tree-popup">
                          <h4>{tree.name}</h4>
                          <p>
                            <strong>Estado:</strong>{" "}
                            {tree.isAdopted === 1
                              ? "Adoptado"
                              : tree.isAdopted === 2
                                ? "Pendiente de confirmación"
                                : "Disponible"}
                          </p>
                          <p>
                            <strong>Precio:</strong> {tree.price} créditos
                          </p>
                          <p>
                            <strong>Ubicación:</strong> {tree.address}
                          </p>
                          {tree.isAdopted === 2 && (
                            <p>
                              <strong>⚠️ En proceso de adopción</strong>
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </div>
          );
        })()}

        <div className="map-legend">
          <div className="legend-item">
            <div className="legend-color available"></div>
            <span className="text-white">Disponibles</span>
          </div>
          <div className="legend-item">
            <div className="legend-color pending"></div>
            <span className="text-white">Pendientes</span>
          </div>
          <div className="legend-item">
            <div className="legend-color adopted"></div>
            <span className="text-white">Adoptados</span>
          </div>
        </div>
      </div>

      {selectedTree && (
        <div className="info-card">
          <section className="tree-details">
            <div className="tree-info-content">
              <h2>Detalles del árbol seleccionado</h2>
              <div className="treehome-tree-details-info">
                <div className="treehome-detail-item">
                  <span className="treehome-label">Árbol</span>
                  <span className="treehome-text">{selectedTree.name}</span>
                </div>
                <div className="treehome-detail-item">
                  <span className="treehome-label">Estado</span>
                  <span className="treehome-text">
                    {selectedTree.isAdopted === 1
                      ? "Adoptado"
                      : selectedTree.isAdopted === 2
                        ? "Pendiente de confirmación"
                        : "Disponible"}
                  </span>
                </div>
                <div className="treehome-detail-item">
                  <span className="treehome-label">Dueño</span>
                  <span className="treehome-text">
                    {selectedTree.isAdopted
                      ? `${selectedTree.currentOwner || "Desconocido"}`
                      : "Sin dueño"}
                  </span>
                </div>
                <div className="treehome-detail-item">
                  <span className="treehome-label">Precio</span>
                  <span className="treehome-text">
                    {selectedTree.price} créditos
                  </span>
                </div>
                <div className="treehome-detail-item treehome-detail-item--full">
                  <span className="treehome-label">Ubicación</span>
                  <span className="treehome-text">
                    {selectedTree.address || "Sin ubicación"}
                  </span>
                </div>
              </div>

              <div className="button-group">
                <button className="btn-secondary" onClick={handleViewHistory}>
                  Ver Historial
                </button>
                <button className="btn-secondary" onClick={handleVisit}>
                  Visitar
                </button>
                {selectedTree.isAdopted === 0 && (
                  <button className="btn-primary" onClick={handleAdopt}>
                    Adoptar
                  </button>
                )}
                {selectedTree.isAdopted === 2 && (
                  <button className="btn-disabled" disabled>
                    En Proceso de Adopción
                  </button>
                )}
                {selectedTree.isAdopted === 1 && (
                  <button className="btn-disabled" disabled>
                    Ya Adoptado
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && treeHistory && (
        <div className="treehome-history-overlay" onClick={closeHistoryModal}>
          <div
            className="treehome-history-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="treehome-history-close"
              onClick={closeHistoryModal}
            >
              ×
            </button>

            <div className="history-modal">
              <header className="history-modal-header">
                <div className="history-modal-titles">
                  <span className="history-modal-subtitle">
                    Historial del árbol
                  </span>
                  <h2 className="history-modal-title">
                    {treeHistory.tree?.name || "Árbol sin nombre"}
                  </h2>
                </div>
                <div className="history-chip-row">
                  {treeHistory.tree?.code && (
                    <span className="history-chip">
                      Código: {treeHistory.tree.code}
                    </span>
                  )}
                  <span
                    className={`history-status-chip status-${
                      treeHistory.tree?.status ?? 0
                    }`}
                  >
                    {getTreeStatusLabel(treeHistory.tree?.status)}
                  </span>
                  {treeHistory.tree?.price !== undefined &&
                    treeHistory.tree?.price !== null && (
                      <span className="history-chip">
                        Precio: {treeHistory.tree.price} créditos
                      </span>
                    )}
                </div>
              </header>

              <div className="history-modal-body">
                <aside className="history-gallery-panel">
                  {historyImages.length > 0 ? (
                    <div className="history-gallery-main">
                      <img
                        src={buildHistoryImageUrl(
                          historyImages[historyImageIndex],
                        )}
                        alt={`Imagen ${historyImageIndex + 1} del árbol ${
                          treeHistory.tree?.name || ""
                        }`}
                        onError={(e) => {
                          console.error(
                            "Error al cargar imagen:",
                            e.target.src,
                          );
                          e.target.style.display = "none";
                          const container = e.target.parentElement;
                          if (container) {
                            container.innerHTML =
                              '<div class="history-gallery-fallback">No se pudo cargar la imagen</div>';
                          }
                        }}
                      />
                      <div className="history-gallery-overlay">
                        <span className="history-gallery-counter">
                          {historyImageIndex + 1}/{historyImages.length}
                        </span>
                      </div>
                      {historyImages.length > 1 && (
                        <div className="history-gallery-controls">
                          <button
                            type="button"
                            className="history-gallery-nav prev"
                            onClick={handlePrevHistoryImage}
                            aria-label="Imagen anterior"
                          >
                            <i
                              className="bi bi-chevron-left"
                              aria-hidden="true"
                            ></i>
                          </button>
                          <button
                            type="button"
                            className="history-gallery-nav next"
                            onClick={handleNextHistoryImage}
                            aria-label="Imagen siguiente"
                          >
                            <i
                              className="bi bi-chevron-right"
                              aria-hidden="true"
                            ></i>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="history-gallery-empty">
                      <div className="tree-icon-large">🌳</div>
                      <p>Este árbol aún no tiene imágenes registradas.</p>
                    </div>
                  )}

                  {historyImages.length > 1 && (
                    <>
                      <div className="history-gallery-progress">
                        {historyImages.map((_, index) => (
                          <span
                            key={`progress-${index}`}
                            className={`history-progress-dot ${
                              index === historyImageIndex ? "active" : ""
                            }`}
                          ></span>
                        ))}
                      </div>
                      <div className="history-gallery-thumbs">
                        {historyImages.map((imagePath, index) => (
                          <button
                            type="button"
                            key={`${imagePath}-${index}`}
                            className={`history-gallery-thumb ${
                              index === historyImageIndex ? "active" : ""
                            }`}
                            onClick={() => handleSelectHistoryImage(index)}
                            aria-label={`Ver imagen ${index + 1}`}
                          >
                            <img
                              src={buildHistoryImageUrl(imagePath)}
                              alt={`Miniatura ${index + 1}`}
                            />
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </aside>

                <div className="history-details-panel">
                  <section className="history-summary-card">
                    <h3 className="history-section-title">Resumen del árbol</h3>
                    {historySummaryMetrics.length > 0 && (
                      <div className="history-metrics-row">
                        {historySummaryMetrics.map((item) => (
                          <div className="history-metric-card" key={item.label}>
                            <span className="history-metric-label">
                              {item.label}
                            </span>
                            <span className="history-metric-value">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {historySummaryDetails.length > 0 && (
                      <div className="history-summary-grid">
                        {historySummaryDetails.map((item) => (
                          <div
                            className="history-summary-item"
                            key={item.label}
                          >
                            <span className="history-summary-label">
                              {item.label}
                            </span>
                            <span className="history-summary-value">
                              {item.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  <section className="history-section-card">
                    <header className="history-section-header">
                      <div>
                        <h3>Riegos registrados</h3>
                        <p>Seguimiento de mantenimiento y cuidado</p>
                      </div>
                      {irrigationCount > 0 && (
                        <span className="history-section-count">
                          {irrigationCount}
                        </span>
                      )}
                    </header>
                    {irrigationCount > 0 ? (
                      <div className="history-timeline">
                        {treeHistory.irrigations.map((irrigation, index) => (
                          <div
                            className="history-timeline-item"
                            key={`${irrigation.id || index}`}
                          >
                            <div className="history-timeline-dot" />
                            <div className="history-timeline-card">
                              <div className="history-timeline-header">
                                <span className="history-timeline-user">
                                  {irrigation.userName}{" "}
                                  {irrigation.userLastName}
                                </span>
                                <span
                                  className={`history-status-pill status-${irrigation.status}`}
                                >
                                  {irrigation.status === 1
                                    ? "Aprobado"
                                    : irrigation.status === 2
                                      ? "Pendiente"
                                      : irrigation.status === 0
                                        ? "Rechazado"
                                        : "Desconocido"}
                                </span>
                              </div>
                              <div className="history-timeline-meta">
                                {new Date(
                                  irrigation.registerDate,
                                ).toLocaleDateString()}
                              </div>
                              <p className="history-timeline-notes">
                                {irrigation.observations ||
                                  "Sin observaciones."}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="history-empty-row">
                        Aún no hay registros de riego para este árbol.
                      </div>
                    )}
                  </section>

                  <section className="history-section-card history-section-card--secondary">
                    <header className="history-section-header">
                      <div>
                        <h3>Historial de adopciones</h3>
                        <p>Usuarios que han cuidado este árbol</p>
                      </div>
                      {previousOwnersCount > 0 && (
                        <span className="history-section-count">
                          {previousOwnersCount}
                        </span>
                      )}
                    </header>
                    {previousOwnersCount > 0 ? (
                      <div className="history-owners-list">
                        {treeHistory.previousOwners.map((owner, index) => (
                          <div
                            className="history-owner-card"
                            key={`${owner.id || index}`}
                          >
                            <div className="history-owner-avatar">
                              <span>{owner.userName?.charAt(0) || "?"}</span>
                            </div>
                            <div className="history-owner-info">
                              <span className="history-owner-name">
                                {owner.userName}
                              </span>
                              <div className="history-owner-dates">
                                <span>
                                  Adopción:{" "}
                                  {new Date(
                                    owner.adoptionDate,
                                  ).toLocaleDateString()}
                                </span>
                                <span>
                                  Finalización:{" "}
                                  {owner.abandonmentDate
                                    ? new Date(
                                        owner.abandonmentDate,
                                      ).toLocaleDateString()
                                    : "Activo"}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="history-empty-row">
                        No se registran adopciones anteriores.
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panel de Notificaciones */}
      <NotificationsPanel
        isOpen={showNotificationsPanel}
        onClose={() => {
          setShowNotificationsPanel(false);
          loadUnreadNotifications();
        }}
      />
    </div>
  );
}
