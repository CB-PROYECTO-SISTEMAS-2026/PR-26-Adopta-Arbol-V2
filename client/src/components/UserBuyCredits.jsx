import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { getAllCreditOptions } from "../api/credit.api.js";
import { useNotification } from "../context/NotificationContext.jsx";
import "./UserBuyCredits.css";

export default function UserBuyCredits() {
  const navigate = useNavigate();
  const { loggedUser } = useUsers();
  const { showError, showWarning } = useNotification();
  const [selectedOption, setSelectedOption] = useState(null);
  const [creditOptions, setCreditOptions] = useState([]);
  const [loading, setLoading] = useState(true);

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
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/tree-home");
  };

  const handleRanking = () => {
    navigate("/ranking");
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
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
    <div className="user-buy-credits-container">
      {/* Header */}
      <header className="user-buy-credits-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">←</span>
        </button>
        <div className="user-info">
          <span className="username">
            🍃 {loggedUser?.username || "Usuario"}
          </span>
          <div className="credits-display">
            <span className="credits-icon">💰</span>
            <span className="credits-amount">{loggedUser?.credits || 0}</span>
          </div>
        </div>
        <button className="ranking-button" onClick={handleRanking}>
          <span className="crown-icon">👑</span>
          Ranking
        </button>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Buy Credits Button */}
        <button className="buy-credits-title">
          <span className="dollar-icon">$</span>
          Comprar Créditos
        </button>

        {/* Credit Options */}
        <div className="credit-options">
          {creditOptions.length > 0 ? (
            creditOptions.map((option) => {
              const totalCredits = parseFloat(option.purchased);
              const isSelected = selectedOption?.id === option.id;

              return (
                <div
                  key={option.id}
                  className={`credit-option-row ${isSelected ? "selected" : ""}`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="credit-option-card">
                    <div className="credit-option-main">
                      <div className="credit-section">
                        <span className="credit-label">Créditos</span>
                        <span className="credit-value">
                          {totalCredits.toFixed(0)}
                        </span>
                        {parseFloat(option.bonus) > 0 && (
                          <span className="bonus-badge">
                            +{parseFloat(option.bonus).toFixed(0)} Bonus
                          </span>
                        )}
                      </div>
                      <div className="price-section">
                        <span className="price-label">Precio</span>
                        <span className="price-value">
                          {parseFloat(option.price).toFixed(2)} Bs
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="selected-indicator">
                        <i className="bi bi-check-circle-fill"></i>
                      </div>
                    )}
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

        {/* Generate QR Button */}
        <button
          className="generate-qr-button"
          onClick={handleGenerateQR}
          disabled={!selectedOption}
        >
          Seleccione una opción para generar su qr
        </button>
      </div>
    </div>
  );
}
