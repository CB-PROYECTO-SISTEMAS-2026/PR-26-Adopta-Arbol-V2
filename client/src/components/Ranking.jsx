import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsersRequest } from "../api/user.api";
import { useUsers } from "../context/UserContext.jsx";
import "./Ranking.css";
import "./IrrigatorMap.css";
import { getUnreadNotificationsRequest } from "../api/notification.api";
import NotificationsPanel from "./NotificationsPanel";

export default function Ranking() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUsersRequest();
        // Filter users by role "adoptante" and sort by points in descending order
        const adoptanteUsers = response.data.filter(
          (user) => user.role === "adoptante",
        );
        const sortedUsers = adoptanteUsers.sort((a, b) => b.point - a.point);
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
    try {
      if (!loggedUser?.id) return;
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
        <nav className="map-navbar">
          <div className="navbar-container">
            <div className="navbar-center">
              <span className="navbar-greeting">
                BIENVENIDO{" "}
                {loggedUser?.name || loggedUser?.username || "Usuario"}
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
                    <button
                      className="logout-card-button"
                      onClick={handleLogout}
                    >
                      <i className="bi bi-box-arrow-right"></i>
                      Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

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
        <div className="loading">Cargando ranking...</div>
      </div>
    );
  }

  return (
    <div className="ranking-container">
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

      <header className="ranking-header">
        <h1>RANKING</h1>
        <p>Mejores Adoptantes</p>
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
                style={{ width: "28px", height: "28px" }}
              />
            </div>
          </div>
        ))}
      </div>
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
