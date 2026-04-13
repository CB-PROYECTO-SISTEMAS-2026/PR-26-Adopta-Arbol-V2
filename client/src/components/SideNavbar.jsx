import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./SideNavbar.css";
import { useUsers } from "../context/UserContext.jsx";

function SideNavbar() {
  const { logout } = useUsers();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMobileMenu = () => {
    setIsMenuOpen((previous) => !previous);
  };

  const handleNavigate = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-top">
          <div className="logo">AdoptTree</div>
          <button
            type="button"
            className="sidebar-hamburger"
            onClick={toggleMobileMenu}
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            <i className={`bi ${isMenuOpen ? "bi-x-lg" : "bi-list"}`}></i>
          </button>
        </div>

        <nav className={`sidebar-nav ${isMenuOpen ? "open" : ""}`}>
          <ul>
            <li>
              <Link to="/users" onClick={handleNavigate}>
                <i className="bi bi-people-fill"></i>
                <span>Usuarios</span>
              </Link>
            </li>
            <li>
              <Link to="/adopt" onClick={handleNavigate}>
                <i className="bi bi-heart-fill"></i>
                <span>Adopciones</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/irrigation" onClick={handleNavigate}>
                <i className="bi bi-droplet-fill"></i>
                <span>Riegos</span>
              </Link>
            </li>
            <li>
              <Link to="/buy-credits" onClick={handleNavigate}>
                <i className="bi bi-coin"></i>
                <span>Créditos</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/redemptions" onClick={handleNavigate}>
                <i className="bi bi-cash-stack"></i>
                <span>Retiros</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/payments" onClick={handleNavigate}>
                <i className="bi bi-cash-coin"></i>
                <span>Pagos</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/tree" onClick={handleNavigate}>
                <i className="bi bi-tree-fill"></i>
                <span>Árboles</span>
              </Link>
            </li>
            <li>
              <Link to="/AdminQr" onClick={handleNavigate}>
                <i className="bi bi-qr-code"></i>
                <span>Qr</span>
              </Link>
            </li>
            <li>
              <Link to="/AdminCategory" onClick={handleNavigate}>
                <i className="bi bi-tags-fill"></i>
                <span>Categories</span>
              </Link>
            </li>
            <li className="logout-item">
              <button
                type="button"
                className="logout-menu-btn"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span>Cerrar Sesión</span>
              </button>
            </li>
          </ul>
        </nav>
        <button className="logout-menu-btn" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </aside>
    </>
  );
}

export default SideNavbar;
