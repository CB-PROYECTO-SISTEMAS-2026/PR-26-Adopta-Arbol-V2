import React from "react";
import { Link } from "react-router-dom";
import "./SideNavbar.css";
import { useUsers } from "../context/UserContext.jsx";

function SideNavbar() {
  const { logout } = useUsers();

  const handleLogout = () => {
    // Usar la función logout del contexto de usuario
    logout();
  };
  return (
    <>
      <aside className="sidebar">
        <div className="logo">AdoptTree</div>
        <nav>
          <ul>
            <li>
              <Link to="/users">
                <i className="bi bi-people-fill"></i>
                <span>Usuarios</span>
              </Link>
            </li>
            <li>
              <Link to="/adopt">
                <i className="bi bi-heart-fill"></i>
                <span>Adopciones</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/irrigation">
                <i className="bi bi-droplet-fill"></i>
                <span>Riegos</span>
              </Link>
            </li>
            <li>
              <Link to="/buy-credits">
                <i className="bi bi-coin"></i>
                <span>Créditos</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/payments">
                <i className="bi bi-cash-coin"></i>
                <span>Pagos</span>
              </Link>
            </li>
            <li>
              <Link to="/admin/tree">
                <i className="bi bi-tree-fill"></i>
                <span>Árboles</span>
              </Link>
            </li>
            <li>
              <Link to="/AdminQr">
                <i className="bi bi-qr-code"></i>
                <span>Qr</span>
              </Link>
            </li>
            <li>
              <Link to="/AdminCategory">
                <i className="bi bi-tags-fill"></i>
                <span>Categories</span>
              </Link>
            </li>
          </ul>
        </nav>
        <button className="logout" onClick={handleLogout}>
          <i className="bi bi-box-arrow-right"></i>
          <span>Cerrar Sesión</span>
        </button>
      </aside>
    </>
  );
}

export default SideNavbar;
