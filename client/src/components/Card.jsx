import React, { useState } from 'react';
import './Card.css';
import QrCard from './QrCard';
import FinalViewCard from './FinalViewCard';

export default function Card({ onClose }) {
  const [step, setStep] = useState(1); // 1: Card, 2: QR, 3: Final
  const [selectedAmount, setSelectedAmount] = useState(null);

  const creditOptions = [
    { id: 1, amount: 45, price: 45 },
    { id: 2, amount: 100, price: 100 },
    { id: 3, amount: 180, price: 150 },
  ];

  const handleBuyClick = (amount) => {
    setSelectedAmount(amount);
    setStep(2);
  };

  const handleBackToCard = () => {
    setStep(1);
  };

  const handleFinalConfirm = () => {
    setStep(3);
  };

  const handleClose = () => {
    onClose();
  };

  if (step === 2) {
    return (
      <QrCard
        selectedAmount={selectedAmount}
        onBack={handleBackToCard}
        onConfirm={handleFinalConfirm}
      />
    );
  }

  if (step === 3) {
    return <FinalViewCard onClose={handleClose} selectedAmount={selectedAmount} />;
  }

  return (
    <div className="card-overlay">
      <div className="card-container">
        {/* Header */}
        <div className="card-header">
          <button className="card-back-btn" onClick={onClose}>
            ←
          </button>
          <h2 className="card-title">Comprar Créditos</h2>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Progress */}
        <div className="card-progress">
          <div className="progress-step active">1</div>
          <div className="progress-line"></div>
          <div className="progress-step">2</div>
          <div className="progress-line"></div>
          <div className="progress-step">3</div>
        </div>

        {/* Card Display */}
        <div className="card-display-section">
          <div className="credit-card">
            <div className="card-chip">
              <div className="chip-pattern"></div>
            </div>
            <div className="card-content">
              <div className="card-balance">
                <span className="balance-label">Saldo</span>
                <span className="balance-amount">Bs. 0.00</span>
              </div>
              <div className="card-credits">
                <span className="credits-label">Créditos</span>
                <span className="credits-amount">0 Credits</span>
              </div>
              <p className="card-holder">CARD HOLDER NAME</p>
            </div>
          </div>
          <p className="card-instruction">Seleccione un monto a canjear</p>
        </div>

        {/* Credit Options */}
        <div className="credit-options">
          {creditOptions.map((option) => (
            <div key={option.id} className="credit-card-option">
              <div className="credit-icon">💳</div>
              <div className="credit-amount">{option.amount}</div>
              <div className="credit-label">Créditos</div>
              <div className="credit-price">Bs {option.price}</div>
              <div className="credit-offer">+Ofertas</div>
            </div>
          ))}
        </div>

        {/* Other Credit Options */}
        <div className="other-options">
          <div className="credit-card-option">
            <div className="credit-icon">💳</div>
            <div className="credit-amount">45</div>
            <div className="credit-label">Créditos</div>
            <div className="credit-price">Bs 45</div>
            <div className="credit-offer">+Ofertas</div>
          </div>
          <div className="credit-card-option">
            <div className="credit-icon">💳</div>
            <div className="credit-amount">100</div>
            <div className="credit-label">Créditos</div>
            <div className="credit-price">Bs 100</div>
            <div className="credit-offer">+Ofertas</div>
          </div>
          <div className="credit-card-option">
            <div className="credit-icon">💳</div>
            <div className="credit-amount">180</div>
            <div className="credit-label">Créditos</div>
            <div className="credit-price">Bs 150</div>
            <div className="credit-offer">+Ofertas</div>
          </div>
        </div>

        {/* Buy Button */}
        <button className="card-buy-btn" onClick={() => handleBuyClick(100)}>
          Comprar
        </button>
      </div>
    </div>
  );
}
