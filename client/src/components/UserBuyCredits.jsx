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
  const { loggedUser, logout, refreshUserData } = useUsers();
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

  useEffect(() => {
    if (
      loggedUser?.id &&
      (!loggedUser?.registerDate || loggedUser.registerDate === "null")
    ) {
      refreshUserData().catch((error) => {
        console.warn("No se pudo refrescar registerDate del usuario:", error);
      });
    }
  }, [loggedUser?.id, loggedUser?.registerDate]);

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

  const getCardColor = (index, total) => {
    if (total === 0) return "card-color-green";
    if (total === 1) return "card-color-green";

    // Calcular porcentaje: qué tan lejos está en la lista (0% al inicio, 100% al final)
    const percentage = (index / (total - 1)) * 100;

    if (percentage < 25) return "card-color-green";
    if (percentage < 50) return "card-color-blue";
    if (percentage < 75) return "card-color-purple";
    return "card-color-orange";
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

  const formatCredits = (value) => {
    const numericCredits = Number(value);
    return Number.isFinite(numericCredits) ? numericCredits.toFixed(2) : "0.00";
  };

  const formatMemberSince = (value) => {
    if (!value) return "N/D";

    // Soporta formato MySQL: YYYY-MM-DD HH:mm:ss
    if (typeof value === "string") {
      const [datePart] = value.split(" ");
      const mysqlDateMatch = datePart.match(/^(\d{4})-(\d{2})-(\d{2})$/);

      if (mysqlDateMatch) {
        const [, year, month] = mysqlDateMatch;
        return `${month}/${year.slice(-2)}`;
      }
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/D";

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  };

  const cardHolderName =
    `${loggedUser?.name || ""} ${loggedUser?.lastName || ""}`
      .trim()
      .toUpperCase();
  const creditsDisplay = formatCredits(loggedUser?.credits);
  const normalizedRegisterDate =
    loggedUser?.registerDate &&
    loggedUser.registerDate !== "null" &&
    loggedUser.registerDate !== "undefined"
      ? loggedUser.registerDate
      : null;
  const normalizedRegisterDateFormatted =
    loggedUser?.registerDateFormatted &&
    loggedUser.registerDateFormatted !== "null" &&
    loggedUser.registerDateFormatted !== "undefined"
      ? loggedUser.registerDateFormatted
      : null;
  const memberSinceDisplay =
    normalizedRegisterDateFormatted ||
    formatMemberSince(normalizedRegisterDate);

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
            <div className="card-title">
              <h1>Tarjeta Adopta un Árbol</h1>
            </div>
            <div className="card-top">
              <div className="card-tech-icons">
                <div className="card-chip-container">
                  <img
                    src="/SimCardChip.svg"
                    alt="SIM Chip"
                    className="chip-image"
                  />
                </div>
                <div className="card-contactless-icon">
                  <img
                    src="/Wifi.svg"
                    alt="Contactless"
                    className="contactless-image"
                  />
                </div>
              </div>
            </div>

            <div className="card-main">
              {/* Card Middle - Balance Info */}
              <div className="card-middle-info">
                <div className="card-info-item">
                  <span className="card-info-label">Créditos:</span>
                  <span className="card-info-value">$ {creditsDisplay}</span>
                </div>
                <div className="card-info-item">
                  <span className="card-info-label">Miembro desde:</span>
                  <span className="card-info-value">{memberSinceDisplay}</span>
                </div>
              </div>

              {/* Card Bottom - Cardholder Name */}
              <div className="card-bottom">
                <span className="cardholder-name">
                  {cardHolderName || "CARD HOLDER NAME"}
                </span>
                <img
                  src="/VisaLogo.svg"
                  alt="Visa"
                  className="visa-logo-image"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="section-title">SELECCIONE UNA OPCIÓN PARA CANJEAR</h3>

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
              const cardColor = getCardColor(index, creditOptions.length);

              return (
                <div
                  key={option.id}
                  className={`credit-option-card ${cardColor} ${isSelected ? "selected" : ""}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="card-icon">
                    <img
                      src="/DollarCoin.svg"
                      alt="Moneda"
                      className="coin-icon-image"
                    />
                  </div>

                  <div className="card-credits-number">{totalCredits}</div>
                  {parseFloat(option.bonus) > 0 && (
                    <div className="card-offer-section">
                      <div className="card-bonus">
                        +{parseFloat(option.bonus).toFixed(0)}
                      </div>
                    </div>
                  )}
                  <div className="card-credits-text">
                    <h6>{totalCredits} Créditos</h6>
                    {parseFloat(option.bonus) > 0 && (
                      <h6>+{parseFloat(option.bonus).toFixed(0)} de regalo</h6>
                    )}
                  </div>
                  <div className="card-price">
                    {parseFloat(option.price).toFixed(0)} Bs.
                  </div>
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
