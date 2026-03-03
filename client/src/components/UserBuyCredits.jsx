import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import "./UserBuyCredits.css";

export default function UserBuyCredits() {
  const navigate = useNavigate();
  const { loggedUser } = useUsers();
  const [selectedOption, setSelectedOption] = useState(null);

  const creditOptions = [
    { credits: 10, price: 10, discount: 0 },
    { credits: 20, price: 18, discount: 2 },
    { credits: 50, price: 45, discount: 5 },
    { credits: 100, price: 88, discount: 12 },
    { credits: 200, price: 200, discount: 0 }
  ];

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
      alert("Por favor selecciona una opción de créditos");
      return;
    }
    
    // Pasar la información de la opción seleccionada
    navigate("/qr-display", { 
      state: { 
        selectedOption: selectedOption,
        credits: selectedOption.credits,
        price: selectedOption.price
      } 
    });
  };

  return (
    <div className="user-buy-credits-container">
      {/* Header */}
      <header className="user-buy-credits-header">
        <button className="back-button" onClick={handleBack}>
          <span className="back-arrow">←</span>
        </button>
        <div className="user-info">
          <span className="username">🍃 {loggedUser?.username || 'Usuario'}</span>
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
          {creditOptions.map((option, index) => (
            <div key={index} className="credit-option-row">
              <button 
                className={`credits-button ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                {option.credits} créditos
              </button>
              <button 
                className={`price-button ${selectedOption === option ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(option)}
              >
                {option.price} Bs
              </button>
            </div>
          ))}
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
