import React from 'react';
import './FinalViewCard.css';

export default function FinalViewCard({ onClose, selectedAmount }) {
  return (
    <div className="final-overlay">
      <div className="final-container">
        {/* Header */}
        <div className="final-header">
          <h2 className="final-title">Compra Completada</h2>
        </div>

        {/* Progress */}
        <div className="final-progress">
          <div className="progress-step">1</div>
          <div className="progress-line"></div>
          <div className="progress-step">2</div>
          <div className="progress-line"></div>
          <div className="progress-step active">3</div>
        </div>

        {/* Content */}
        <div className="final-content">
          {/* Success Icon */}
          <div className="success-icon-container">
            <div className="success-icon">
              <svg
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="4"
              >
                <circle cx="50" cy="50" r="45" />
                <path
                  d="M 30 50 L 45 65 L 70 35"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Message */}
          <h1 className="final-heading">¡Compra Exitosa!</h1>
          <p className="final-message">
            Canjeo de Créditos en Revisión
          </p>

          {/* Details */}
          <div className="final-details">
            <div className="detail-item">
              <span className="detail-label">Créditos Comprados:</span>
              <span className="detail-value">70 Credits</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Estado:</span>
              <span className="detail-value status-pending">Pendiente</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Un administrador verá la solicitud dentro de:</span>
              <span className="detail-value">24 Horas</span>
            </div>
          </div>

          {/* Additional Info */}
          <div className="final-info-box">
            <div className="info-icon">👁️</div>
            <p className="final-info-text">
              El pago será revisado por un administrador. Una vez aprobado los créditos serán agregados a tu cuenta.
            </p>
          </div>

          {/* Button */}
          <button className="final-btn" onClick={onClose}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
