import { useEffect, useMemo, useState } from "react";
import "./AdminFinanceDashboard.css";
import { getAllPurchases } from "../api/credit.api.js";
import { getPendingRedemptions } from "../api/redemption.api.js";

const chartWidth = 640;
const chartHeight = 240;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatAmount = (value) => {
  const parsed = toNumber(value);
  return parsed.toLocaleString("es-BO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const getDateKey = (dateValue) => {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const buildSeries = (items, amountGetter) => {
  const map = new Map();

  items.forEach((item) => {
    const dateKey = getDateKey(item.lastUpdate || item.registerDate);
    if (!dateKey) return;

    const current = map.get(dateKey) || 0;
    map.set(dateKey, current + amountGetter(item));
  });

  return map;
};

const buildPoints = (values, maxValue) => {
  if (!values.length) return [];
  const safeMax = maxValue > 0 ? maxValue : 1;

  return values.map((value, index) => {
    const x =
      values.length === 1
        ? chartWidth / 2
        : (index / (values.length - 1)) * chartWidth;
    const y = chartHeight - (value / safeMax) * chartHeight;
    return { x, y };
  });
};

export default function AdminFinanceDashboard() {
  const [purchases, setPurchases] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [purchaseResponse, redemptionResponse] = await Promise.all([
          getAllPurchases(),
          getPendingRedemptions(),
        ]);

        if (!isMounted) return;

        setPurchases(purchaseResponse.data || []);
        setRedemptions(redemptionResponse.data || []);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error cargando dashboard financiero:", err);
        setError("No se pudo cargar la informacion financiera.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const dashboardData = useMemo(() => {
    const confirmedPurchases = purchases.filter(
      (purchase) => Number(purchase.status) === 1,
    );
    const confirmedRedemptions = redemptions.filter(
      (redemption) => Number(redemption.status) === 1,
    );

    const totalIncome = confirmedPurchases.reduce(
      (accumulator, purchase) => accumulator + toNumber(purchase.price),
      0,
    );
    const totalOutflow = confirmedRedemptions.reduce(
      (accumulator, redemption) => accumulator + toNumber(redemption.amount),
      0,
    );

    const incomeByDate = buildSeries(confirmedPurchases, (purchase) =>
      toNumber(purchase.price),
    );
    const outflowByDate = buildSeries(confirmedRedemptions, (redemption) =>
      toNumber(redemption.amount),
    );

    const chartDates = Array.from(
      new Set([...incomeByDate.keys(), ...outflowByDate.keys()]),
    ).sort();

    const incomeSeries = chartDates.map((date) => incomeByDate.get(date) || 0);
    const outflowSeries = chartDates.map(
      (date) => outflowByDate.get(date) || 0,
    );

    const maxValue = Math.max(0, ...incomeSeries, ...outflowSeries);

    return {
      totalIncome,
      totalOutflow,
      confirmedPurchases,
      confirmedRedemptions,
      chartDates,
      incomeSeries,
      outflowSeries,
      maxValue,
    };
  }, [purchases, redemptions]);

  const incomePoints = buildPoints(
    dashboardData.incomeSeries,
    dashboardData.maxValue,
  );
  const outflowPoints = buildPoints(
    dashboardData.outflowSeries,
    dashboardData.maxValue,
  );

  const incomePointsString = incomePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const outflowPointsString = outflowPoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <div className="dashboard-container finance-dashboard">
      <header className="admin-header finance-header">
        <div className="finance-title">
          <span className="finance-eyebrow">Dashboard</span>
          <h1>Flujo financiero</h1>
          <p>Ingresos y egresos confirmados en la aplicacion</p>
        </div>
        <div className="admin-info">
          <span className="admin-text">Administrador</span>
          <div className="admin-avatar">
            <i className="bi bi-person-fill avatar-icon"></i>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="finance-state">Cargando informacion...</div>
      ) : error ? (
        <div className="finance-state error">{error}</div>
      ) : (
        <>
          <section className="finance-cards">
            <article className="finance-card income">
              <div className="finance-card-header">
                <div>
                  <span className="finance-card-label">
                    Ingresos por recargas confirmadas
                  </span>
                  <h2>Bs. {formatAmount(dashboardData.totalIncome)}</h2>
                </div>
                <span className="finance-card-icon">
                  <i className="bi bi-graph-up-arrow"></i>
                </span>
              </div>
              <p className="finance-card-foot">
                Compras aprobadas: {dashboardData.confirmedPurchases.length}
              </p>
            </article>

            <article className="finance-card outflow">
              <div className="finance-card-header">
                <div>
                  <span className="finance-card-label">
                    Retiros confirmados
                  </span>
                  <h2>Bs. {formatAmount(dashboardData.totalOutflow)}</h2>
                </div>
                <span className="finance-card-icon">
                  <i className="bi bi-graph-down-arrow"></i>
                </span>
              </div>
              <p className="finance-card-foot">
                Solicitudes aprobadas: {dashboardData.confirmedRedemptions.length}
              </p>
            </article>
          </section>

          <section className="finance-chart-card">
            <div className="finance-chart-header">
              <div>
                <h3>Grafica de flujo de dinero</h3>
                <p>
                  Registra compras aprobadas y retiros confirmados a lo largo del
                  tiempo.
                </p>
              </div>
              <div className="finance-legend">
                <span className="legend-item">
                  <span className="legend-dot income"></span>
                  Ingresos
                </span>
                <span className="legend-item">
                  <span className="legend-dot outflow"></span>
                  Egresos
                </span>
              </div>
            </div>

            <div className="finance-chart-body">
              {dashboardData.chartDates.length === 0 ? (
                <div className="finance-chart-empty">
                  Sin datos confirmados para graficar.
                </div>
              ) : (
                <svg
                  className="finance-chart"
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  role="img"
                  aria-label="Grafica de ingresos y egresos"
                >
                  <polyline
                    className="chart-line income"
                    points={incomePointsString}
                    fill="none"
                  />
                  <polyline
                    className="chart-line outflow"
                    points={outflowPointsString}
                    fill="none"
                  />
                  {incomePoints.map((point, index) => (
                    <circle
                      key={`income-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className="chart-point income"
                    />
                  ))}
                  {outflowPoints.map((point, index) => (
                    <circle
                      key={`outflow-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className="chart-point outflow"
                    />
                  ))}
                </svg>
              )}
            </div>

            <div className="finance-chart-footer">
              <span>
                {dashboardData.chartDates[0] || "-"}
              </span>
              <span>
                {dashboardData.chartDates[dashboardData.chartDates.length - 1] ||
                  "-"}
              </span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
