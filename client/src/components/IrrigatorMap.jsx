import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./IrrigatorMap.css";
import {
  getPendingIrrigationsRequest,
  getAssignedIrrigationRequest,
  assignTreeToIrrigatorRequest,
} from "../api/irrigation.api.js";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";
import { getUnreadNotificationsRequest } from "../api/notification.api";
import NotificationsPanel from "./NotificationsPanel";

const REWARD_RATE = 0.7;

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

const calculateRewardShare = (reward) => {
  const base = toNumeric(reward);
  return Math.round(base * REWARD_RATE);
};

const formatPoints = (value) => {
  const numeric = toNumeric(value);
  return new Intl.NumberFormat("es-BO", {
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

// Ícono para árboles que necesitan riego
const waterDropIcon = L.divIcon({
  html: `<div style="
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #ffffff;
    border: 2px solid #1f9d55;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
  ">
    <i class="bi bi-tree-fill" style="color: #16a34a; font-size: 20px;"></i>
  </div>`,
  className: "custom-tree-marker",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

// Ícono para la ubicación del regador
const irrigatorIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/219/219988.png", // 👤 Persona caminando
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Componente para centrar el mapa en la ubicación del usuario
function UserLocation({ setUserLocation }) {
  const [position, setPosition] = useState(null);
  const map = useMap();

  useEffect(() => {
    map.locate().on("locationfound", (e) => {
      setPosition(e.latlng);
      setUserLocation(e.latlng);
      map.flyTo(e.latlng, 14);
    });
  }, [map, setUserLocation]);

  return position ? <Marker position={position} icon={irrigatorIcon} /> : null;
}

export default function IrrigatorMap() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const { showSuccess, showError } = useNotification();

  const [irrigations, setIrrigations] = useState([]);
  const [selectedIrrigation, setSelectedIrrigation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [hasAssignedIrrigation, setHasAssignedIrrigation] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  // Cargar irrigation pendientes o asignados
  useEffect(() => {
    loadIrrigations();
    loadUnreadNotifications();
  }, []);

  const loadUnreadNotifications = async () => {
    if (!loggedUser?.id) return;

    try {
      const response = await getUnreadNotificationsRequest(loggedUser.id);
      setUnreadNotificationsCount(response.count || 0);
    } catch (error) {
      console.error("Error al cargar notificaciones no leídas:", error);
    }
  };

  const loadIrrigations = async () => {
    try {
      setLoading(true);

      // Primero verificar si el regador tiene un irrigation asignado
      if (loggedUser?.id) {
        const assignedResponse = await getAssignedIrrigationRequest(
          loggedUser.id,
        );
        if (assignedResponse.data.length > 0) {
          // Si tiene irrigation asignado, mostrar solo ese
          setIrrigations(assignedResponse.data);
          setHasAssignedIrrigation(true);
        } else {
          // Si no tiene irrigation asignado, mostrar los pendientes
          const pendingResponse = await getPendingIrrigationsRequest();
          setIrrigations(pendingResponse.data);
          setHasAssignedIrrigation(false);
        }
      }
    } catch (error) {
      console.error("Error al cargar irrigation:", error);
      showError("Error al cargar los riegos");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerClick = (irrigation) => {
    setSelectedIrrigation(irrigation);
  };

  const handleAcceptRequest = async () => {
    if (!selectedIrrigation || !loggedUser?.id) return;

    setAssigning(true);
    try {
      const response = await assignTreeToIrrigatorRequest(
        selectedIrrigation.irrigationId,
        loggedUser.id,
      );
      showSuccess(
        "✅ Árbol asignado exitosamente! Ahora puedes verlo en el mapa.",
      );
      // Recargar para mostrar solo el irrigation asignado
      loadIrrigations();
    } catch (error) {
      console.error("Error al asignar irrigation:", error);
      showError(
        error.response?.data?.message ||
          error.message ||
          "Error al asignar el riego",
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleConfirmIrrigation = () => {
    if (!selectedIrrigation) return;
    // Navegar a la pantalla de confirmación con el ID del irrigation
    navigate(`/regador/confirm/${selectedIrrigation.irrigationId}`);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const selectedPriceValue = toNumeric(selectedIrrigation?.price);
  const hasSelectedPrice = selectedPriceValue > 0;

  return (
    <div className="irrigator-map-container">
      {/* Navbar */}
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
                setShowNotificationsPanel(true);
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-bell-fill"></i>
              <span>Notificaciones</span>
              {unreadNotificationsCount > 0 && (
                <div className="flex justify-end ml-auto">
                  <span className="menu-badge">{unreadNotificationsCount}</span>
                </div>
              )}
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/regador/map");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-droplet-fill"></i>
              <span>Riegos</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/regador/ranking");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/regador/credits");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-currency-dollar"></i>
              <span>Retirar</span>
            </button>
          </div>
        )}
      </nav>

      {/* Título */}
      <div className="title-section">
        <h1>
          {hasAssignedIrrigation ? "🌳 Tu Árbol Asignado" : "Riegos Pendientes"}
        </h1>
        <p>
          {hasAssignedIrrigation
            ? "Tu árbol asignado para regar"
            : "Selecciona un Riego en el mapa para asignártelo"}
        </p>
      </div>

      {/* Card del Mapa */}
      <div className="map-card">
        <div className="map-container-wrapper">
          {loading ? (
            <div className="loading-message">Cargando irrigation...</div>
          ) : irrigations.length === 0 ? (
            <div className="no-irrigations-message">
              <p>
                {hasAssignedIrrigation
                  ? "No tienes riegos asignados"
                  : "No hay riegos pendientes en este momento"}
              </p>
            </div>
          ) : (
            <MapContainer
              center={[-16.5, -68.15]}
              zoom={13}
              style={{ height: "100%", width: "100%", minHeight: "500px" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />

              {/* Ubicación del usuario */}
              <UserLocation setUserLocation={setUserLocation} />

              {/* Marcadores de irrigation */}
              {irrigations.map((irrigation) => {
                const priceValue = toNumeric(irrigation.price);
                const hasPrice = priceValue > 0;

                return (
                  <Marker
                    key={irrigation.irrigationId}
                    position={[irrigation.latitude, irrigation.longitude]}
                    icon={waterDropIcon}
                    eventHandlers={{
                      click: () => handleMarkerClick(irrigation),
                    }}
                  >
                    <Popup>
                      <div className="popup-content">
                        <h3>{irrigation.treeName}</h3>
                        <p>
                          <strong>Código:</strong> {irrigation.treeCode}
                        </p>
                        <p>
                          <strong>Dirección:</strong>{" "}
                          {irrigation.treeAddress || "No especificada"}
                        </p>
                        <p>
                          <strong>Precio:</strong>{" "}
                          {hasPrice
                            ? `${formatPoints(priceValue)} pts`
                            : "No disponible"}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </div>
      </div>

      {/* Panel de información del irrigation seleccionado */}
      {selectedIrrigation && (
        <div className="info-card">
          <div className="tree-info-content">
            <h2>Información del Riego</h2>
            <div>
              <div className="detail-row">
                <span className="label">Árbol:</span>
                <span>{selectedIrrigation.treeName}</span>
              </div>
              <div className="detail-row">
                <span className="label">Código:</span>
                <span>{selectedIrrigation.treeCode}</span>
              </div>
              <div className="detail-row">
                <span className="label">Precio:</span>
                <span>
                  {hasSelectedPrice
                    ? `${formatPoints(selectedPriceValue)} pts`
                    : "No disponible"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Dirección:</span>
                <span>
                  {selectedIrrigation.treeAddress || "No especificada"}
                </span>
              </div>
            </div>

            <div className="button-group">
              {hasAssignedIrrigation ? (
                <>
                  <button
                    className="btn-canjear"
                    onClick={handleConfirmIrrigation}
                  >
                    Confirmar Riego
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setSelectedIrrigation(null)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn-canjear"
                    onClick={handleAcceptRequest}
                    disabled={assigning}
                  >
                    {assigning ? "Asignando..." : "Asignar Árbol para regar"}
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => setSelectedIrrigation(null)}
                    disabled={assigning}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="copyright">
        © 2025 Adopta, todos los derechos reservados.
      </div>

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
