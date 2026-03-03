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
          (user) => user.role === "regador"
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
          <button className="btn-back-map" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left"></i>
          </button>

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
              <span className="user-points">{user.point}</span>
            </div>
            <div className="tree-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
              </svg>
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
