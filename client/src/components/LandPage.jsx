import React from "react";
import { useNavigate } from "react-router-dom";
import "./LandPage.css";

const LandPage = () => {
  const navigate = useNavigate();

  const goLogin = () => navigate("/login");
  const goRegister = () => navigate("/register");

  return (
    <div className="landing-page">
      <header className="hero">
        <div className="hero__overlay" />

        <nav className="hero__nav">
          <div className="brand">
            <span className="brand__icon" aria-hidden="true">
              🌱
            </span>
            <span className="brand__name">Adopta Un Árbol</span>
          </div>

          <div className="hero__nav-actions">
            <button
              type="button"
              className="btn btn--ghost text-center"
              onClick={goLogin}
            >
              Ingresar
            </button>
            <button
              type="button"
              className="btn text-center"
              onClick={goRegister}
            >
              Crear cuenta
            </button>
          </div>
        </nav>

        <div className="hero__content">
          <p className="hero__eyebrow">Programa comunitario</p>
          <h1>
            Conectamos personas, barrios y empresas para regenerar bosques
            urbanos.
          </h1>
          <p className="hero__description">
            Adopta el cuidado de un árbol, recibe reportes reales de su
            crecimiento y colabora con especialistas que garantizan su
            bienestar.
          </p>

          <ul className="hero__metrics">
            <li>
              <span className="metric__value">+3.200</span>
              <span className="metric__label">Árboles activos</span>
            </li>
            <li>
              <span className="metric__value">42</span>
              <span className="metric__label">Comunidades aliadas</span>
            </li>
            <li>
              <span className="metric__value">96%</span>
              <span className="metric__label">Supervivencia anual</span>
            </li>
          </ul>
        </div>
      </header>
    </div>
  );
};

export default LandPage;
