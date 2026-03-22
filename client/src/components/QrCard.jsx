import React from 'react';
import './QrCard.css';

export default function QrCard({ selectedAmount, onBack, onConfirm }) {
  return (
    <div className="qr-overlay">
      <div className="qr-container">
        {/* Header */}
        <div className="qr-header">
          <button className="qr-back-btn" onClick={onBack}>
            ←
          </button>
          <h2 className="qr-title">Código Escaneable</h2>
          <div style={{ width: '24px' }}></div>
        </div>

        {/* Progress */}
        <div className="qr-progress">
          <div className="progress-step">1</div>
          <div className="progress-line"></div>
          <div className="progress-step active">2</div>
          <div className="progress-line"></div>
          <div className="progress-step">3</div>
        </div>

        {/* Content */}
        <div className="qr-content">
          <div className="qr-info">
            <p className="qr-label">Escanee el Código QR o Descarguelo y adjunte el comprobante</p>
          </div>

          {/* QR Code Display */}
          <div className="qr-code-display">
            <svg
              viewBox="0 0 200 200"
              className="qr-code-svg"
              id="QRCode"
            >
              {/* Simple QR pattern */}
              <rect width="200" height="200" fill="white" />
              
              {/* Position markers */}
              <g fill="black">
                {/* Top-left */}
                <rect x="10" y="10" width="50" height="50" />
                <rect x="15" y="15" width="40" height="40" fill="white" />
                <rect x="20" y="20" width="30" height="30" />
                
                {/* Top-right */}
                <rect x="140" y="10" width="50" height="50" />
                <rect x="145" y="15" width="40" height="40" fill="white" />
                <rect x="150" y="20" width="30" height="30" />
                
                {/* Bottom-left */}
                <rect x="10" y="140" width="50" height="50" />
                <rect x="15" y="145" width="40" height="40" fill="white" />
                <rect x="20" y="150" width="30" height="30" />
              </g>

              {/* Data area pattern */}
              <g fill="black" opacity="0.7">
                <rect x="70" y="30" width="8" height="8" />
                <rect x="85" y="30" width="8" height="8" />
                <rect x="100" y="30" width="8" height="8" />
                <rect x="115" y="30" width="8" height="8" />
                <rect x="70" y="50" width="8" height="8" />
                <rect x="100" y="50" width="8" height="8" />
                <rect x="115" y="50" width="8" height="8" />
                <rect x="70" y="70" width="8" height="8" />
                <rect x="85" y="70" width="8" height="8" />
                <rect x="115" y="70" width="8" height="8" />
                
                <rect x="65" y="100" width="8" height="8" />
                <rect x="85" y="100" width="8" height="8" />
                <rect x="100" y="100" width="8" height="8" />
                <rect x="115" y="100" width="8" height="8" />
                <rect x="130" y="100" width="8" height="8" />
                
                <rect x="70" y="120" width="8" height="8" />
                <rect x="85" y="120" width="8" height="8" />
                <rect x="115" y="120" width="8" height="8" />
                <rect x="70" y="140" width="8" height="8" />
                <rect x="100" y="140" width="8" height="8" />
              </g>
            </svg>
          </div>

          {/* Amount Display */}
          <div className="qr-amount">
            <span className="amount-label">Monto a pagar</span>
            <span className="amount-value">70 Créditos</span>
          </div>

          {/* Action Buttons */}
          <div className="qr-actions">
            <button className="qr-action-btn download">
              Descargar QR
            </button>
            <button className="qr-action-btn upload">
              Adjuntar Comprobante
            </button>
          </div>

          {/* Confirm Button */}
          <button className="qr-confirm-btn" onClick={onConfirm}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
