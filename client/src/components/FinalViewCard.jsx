import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./FinalViewCard.css";

export default function FinalViewCard() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedCredits = location.state?.credits;

  const handleBack = () => {
    navigate("/user-buy-credits");
  };

  return (
    <div className="final-screen">
      <div className="final-container d-flex flex-column justify-content-between align-items-center text-center">
        <h2 className="final-title">Compra de Créditos en Revisión</h2>

        <div className="final-progress" aria-label="Progreso de compra">
          <div className="progress-item">
            <div className="progress-step done">1</div>
            <span className="progress-text">Seleccionar</span>
          </div>
          <div className="progress-item">
            <div className="progress-step done">2</div>
            <span className="progress-text">Pagar</span>
          </div>
          <div className="progress-item">
            <div className="progress-step active">3</div>
            <span className="progress-text">Confirmar</span>
          </div>
        </div>

        <div className="final-content">
          <div className="review-icon-container" aria-hidden="true">
            <i className="bi bi-eye-fill review-icon"></i>
          </div>

          <h1 className="final-heading">Muchas gracias por su compra.</h1>

          <p className="final-info-text">
            El pago será revisado por un administrador, una vez aprobado los
            créditos serán agregados a su cuenta.
          </p>

          {selectedCredits ? (
            <p className="final-credits-note">
              Créditos solicitados: {selectedCredits}
            </p>
          ) : null}

          
        </div>
        <button className="final-btn" onClick={handleBack}>
            Volver
          </button>
      </div>
    </div>
  );
}
