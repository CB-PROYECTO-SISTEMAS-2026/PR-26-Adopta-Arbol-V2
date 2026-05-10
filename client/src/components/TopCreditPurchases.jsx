import { useEffect, useState } from "react";
import { getTopCreditOptions } from "../api/credit.api.js";
import "./TopCreditPurchases.css";

const formatAmount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0.00";
  return parsed.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function TopCreditPurchases() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTopOptions = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getTopCreditOptions();
        setOptions(response.data || []);
      } catch (err) {
        console.error("Error al cargar opciones de crédito:", err);
        setError("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchTopOptions();
  }, []);

  let bodyContent = null;

  if (loading) {
    bodyContent = <div className="credit-state">Cargando...</div>;
  } else if (error) {
    bodyContent = <div className="credit-state error">{error}</div>;
  } else if (options.length === 0) {
    bodyContent = <div className="credit-state">Sin datos disponibles.</div>;
  } else {
    bodyContent = (
      <div className="credit-purchases-list">
        {options.map((option, index) => (
          <div key={option.id} className="credit-purchase-item">
            <div className="credit-item-info">
              <div className="credit-item-price">
                <strong>Bs {formatAmount(option.price)}</strong>
              </div>
              <div className="credit-item-details">
                <span className="credit-purchased">
                  {formatAmount(option.purchased)} créditos recibidos
                </span>
                {option.bonus > 0 && (
                  <span className="credit-bonus">
                    + {formatAmount(option.bonus)} bonificados
                  </span>
                )}
              </div>
            </div>

            <div className="credit-item-count">
              <span className="purchase-count">{option.purchaseCount}</span>
              <span className="purchase-label">compras</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="credit-panel">
      <div className="finance-chart-header credit-header">
        <div>
          <h3>Top Opciones de Crédito</h3>
          <p>Más compradas por adoptantes</p>
        </div>
      </div>
      <div className="finance-chart-body credit-body">
        {bodyContent}
      </div>
    </div>
  );
}
