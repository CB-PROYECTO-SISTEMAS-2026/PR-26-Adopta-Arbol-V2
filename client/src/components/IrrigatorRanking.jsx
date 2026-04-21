import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsersRequest } from "../api/user.api";
import { getUnreadNotificationsRequest } from "../api/notification.api";
import { useUsers } from "../context/UserContext.jsx";
import NotificationsPanel from "./NotificationsPanel";
import "./Ranking.css";
import "./IrrigatorMap.css"; // reutilizar estilos del navbar

export default function IrrigatorRanking() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsersRequest();
        // Filtrar usuarios por rol "regador" y ordenar por puntos de forma descendente
        const regadorUsers = response.data.filter(
          (user) => user.role === "regador",
        );
        const sortedUsers = regadorUsers.sort((a, b) => b.point - a.point);
        setUsers(sortedUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
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

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="ranking-container">
        <div className="loading">Cargando ranking...</div>
      </div>
    );
  }

  return (
    <div className="ranking-container">
      {/* Navbar (reutiliza la estructura de IrrigatorMap) */}
      <nav className="map-navbar">
        <div className="navbar-container">
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
        {/* Menú desplegable (responsive) */}
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

      <header className="ranking-header">
        <h1>RANKING</h1>
        <p>Mejores Regadores</p>
      </header>
      <div className="ranking-list">
        {users.map((user, index) => (
          <div key={user.id} className="ranking-item">
            <div className="ranking-index">{index + 1}</div>
            <div className="ranking-user-avatar">
              <div className="ranking-avatar-circle">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
            </div>
            <div className="user-info">
              <span className="ranking-user-name">
                {user.name} {user.lastName}
              </span>
              <span className="user-points">{user.point} puntos</span>
            </div>
            <div>
              <img
                src="/StartCoin.svg"
                alt="coin"
                style={{ width: "36px", height: "36px" }}
              />
            </div>
          </div>
        ))}
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
