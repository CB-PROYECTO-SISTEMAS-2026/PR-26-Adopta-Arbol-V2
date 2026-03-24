import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { getAllCreditOptions } from "../api/credit.api.js";
import { useNotification } from "../context/NotificationContext.jsx";
import "./UserBuyCredits.css";
import "./IrrigatorMap.css";
import "./TreeHome.css";

export default function UserBuyCredits() {
  const navigate = useNavigate();
  const { loggedUser, logout } = useUsers();
  const { showError, showWarning, showConfirm } = useNotification();
  const [selectedOption, setSelectedOption] = useState(null);
  const [creditOptions, setCreditOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

  useEffect(() => {
    loadCreditOptions();
  }, []);

  const loadCreditOptions = async () => {
    try {
      setLoading(true);
      const response = await getAllCreditOptions();
      console.log("Opciones de crédito cargadas:", response.data);
      setCreditOptions(response.data || []);
    } catch (error) {
      console.error("Error cargando opciones de crédito:", error);
      showError("Error al cargar las opciones de crédito. Intenta más tarde.");
      // Fallback a opciones por defecto
      setCreditOptions([
        { id: 1, amount: 10, price: 10.0, purchased: 10.0, bonus: 0.0 },
        { id: 2, amount: 20, price: 18.0, purchased: 20.0, bonus: 2.0 },
        { id: 3, amount: 50, price: 45.0, purchased: 50.0, bonus: 5.0 },
        { id: 4, amount: 100, price: 88.0, purchased: 100.0, bonus: 12.0 },
        { id: 5, amount: 200, price: 200.0, purchased: 200.0, bonus: 0.0 },
        { id: 6, amount: 160, price: 160.0, purchased: 160.0, bonus: 0.0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/tree-home");
  };

  const handleLogout = () => {
    showConfirm("¿Estás seguro de que deseas cerrar sesión?", () => {
      logout();
      navigate("/login");
    });
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  const getCardColor = (index) => {
    const colors = [
      "card-color-dark", // Índice 0: muy oscuro
      "card-color-purple1", // Índice 1: púrpura oscuro
      "card-color-purple2", // Índice 2: púrpura medio
      "card-color-purple3", // Índice 3: púrpura claro
      "card-color-orange", // Índice 4: naranja
      "card-color-coral", // Índice 5: coral
    ];
    return colors[index % colors.length];
  };

  const handleGenerateQR = () => {
    if (!selectedOption) {
      showWarning("Por favor selecciona una opción de créditos");
      return;
    }

    // Pasar la información de la opción seleccionada (incluyendo el ID)
    navigate("/qr-display", {
      state: {
        selectedOption: selectedOption,
        creditOptionId: selectedOption.id,
        credits: selectedOption.purchased + selectedOption.bonus, // Total de créditos
        price: selectedOption.price,
      },
    });
  };

  if (loading) {
    return (
      <div className="user-buy-credits-container">
        <div className="loading-message">Cargando opciones de crédito...</div>
      </div>
    );
  }

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

      {/* Main Content */}
      <div className="buy-credits-content bg-white">
        {/* Credit Card Chip */}
        <div className="credit-card-section">
          <div className="credit-card">
            {/* Card Top - Chip and Contactless */}
            <div className="card-top">
              <div className="card-chip-container">
                <img src="/cardChip.jpg" alt="Chip" className="chip-image" />
              </div>
              <div className="card-contactless-icon">
                <i className="bi bi-wifi"></i>
              </div>
            </div>

            {/* Card Middle - Balance Info */}
            <div className="card-middle-info">
              <div className="balance-item">
                <span className="balance-label">Saldo</span>
                <span className="balance-value">
                  Bs. {loggedUser?.balance || "0.00"}
                </span>
              </div>
              <div className="credits-item">
                <span className="credits-label">Créditos</span>
                <span className="credits-value">
                  $ {loggedUser?.credits || "0"}
                </span>
              </div>
            </div>

            {/* Card Bottom - Cardholder Name */}
            <div className="card-bottom">
              <span className="cardholder-name">
                {loggedUser?.name || "CARD HOLDER NAME"}
              </span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="section-title">Seleccione una opción a canjear</h2>

        {/* Step Indicator */}
        <div className="steps-indicator">
          <div className={`step ${currentStep === 1 ? "active" : ""}`}>
            <span>1</span>
          </div>
          <div className={`step ${currentStep === 2 ? "active" : ""}`}>
            <span>2</span>
          </div>
          <div className={`step ${currentStep === 3 ? "active" : ""}`}>
            <span>3</span>
          </div>
        </div>

        {/* Credit Options Grid */}
        <div className="credit-options-grid">
          {creditOptions.length > 0 ? (
            creditOptions.map((option, index) => {
              const totalCredits =
                parseFloat(option.purchased) + parseFloat(option.bonus);
              const isSelected = selectedOption?.id === option.id;
              const cardColor = getCardColor(index);

              return (
                <div
                  key={option.id}
                  className={`credit-option-card ${cardColor} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="card-icon">
                    <i className="bi bi-coin"></i>
                  </div>
                  <div className="card-price">
                    {parseFloat(option.price).toFixed(0)} Bs.
                  </div>
                  <div className="card-credits-number">{totalCredits}</div>
                  <div className="card-credits-text">Créditos</div>
                  {parseFloat(option.bonus) > 0 && (
                    <div className="card-offer-section">
                      <div className="card-offer">Oferta</div>
                      <div className="card-bonus">
                        + {parseFloat(option.bonus).toFixed(0)} Créditos
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="no-options">
              No hay opciones de crédito disponibles
            </div>
          )}
        </div>

        {/* Canjear Button */}
        <button
          className="exchange-button"
          onClick={handleGenerateQR}
          disabled={!selectedOption}
        >
          Canjear
        </button>
      </div>
    </div>
  );
}
