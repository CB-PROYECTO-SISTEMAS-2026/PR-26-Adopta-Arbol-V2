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
      <div className="final-container">
        <h2 className="final-title">Canjeo de Créditos en Revisión</h2>

        <div className="final-progress">
          <div className="progress-step done">1</div>
          <div className="progress-line"></div>
          <div className="progress-step done">2</div>
          <div className="progress-line"></div>
          <div className="progress-step active">3</div>
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

          <button className="final-btn" onClick={handleBack}>
            Volver
          </button>
        </div>
      </div>
    </div>
  );
}
