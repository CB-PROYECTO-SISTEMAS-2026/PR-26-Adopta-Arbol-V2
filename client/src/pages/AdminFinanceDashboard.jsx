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
    const y = chartHeight / 2 - (value / safeMax) * (chartHeight / 2);
    return { x, y };
  });
};

const generateYAxisLabels = (maxValue, count = 5) => {
  if (maxValue === 0) return [{ value: 0, y: chartHeight / 2 }];

  const step = Math.ceil(maxValue / ((count - 1) / 2));
  const labels = [];
  const centerY = chartHeight / 2;

  // Generar labels positivos
  for (let i = 0; i <= count / 2; i++) {
    const value = i * step;
    if (value > maxValue) break;
    const y = centerY - (value / maxValue) * (chartHeight / 2);
    labels.push({ value, y });
  }

  // Generar labels negativos (egresos)
  for (let i = 1; i <= count / 2; i++) {
    const value = -i * step;
    if (Math.abs(value) > maxValue) break;
    const y = centerY - (value / maxValue) * (chartHeight / 2);
    labels.push({ value, y });
  }

  // Ordenar por valor
  labels.sort((a, b) => b.value - a.value);

  // Agregar 0 si no está
  if (!labels.find((l) => l.value === 0)) {
    labels.push({ value: 0, y: centerY });
  }

  return labels.sort((a, b) => b.value - a.value);
};
};

const generateXAxisLabels = (dates, events, maxPoints = 6) => {
  if (events.length === 0) return [];

  // Obtener índices de eventos con fechas únicas
  const uniqueDateIndices = [];
  const seenDates = new Set();

  dates.forEach((date, index) => {
    if (!seenDates.has(date)) {
      uniqueDateIndices.push(index);
      seenDates.add(date);
    }
  });

  // Si hay muchas fechas, espaciarlas
  let indices = uniqueDateIndices;
  if (uniqueDateIndices.length > maxPoints) {
    const step = Math.ceil(uniqueDateIndices.length / maxPoints);
    indices = [];
    for (let i = 0; i < uniqueDateIndices.length; i += step) {
      indices.push(uniqueDateIndices[i]);
    }
    // Siempre incluir el último
    if (indices[indices.length - 1] !== uniqueDateIndices[uniqueDateIndices.length - 1]) {
      indices.push(uniqueDateIndices[uniqueDateIndices.length - 1]);
    }
  }

  return indices.map((index) => ({
    date: dates[index],
    x:
      events.length === 1
        ? chartWidth / 2
        : (index / (events.length - 1)) * chartWidth,
  }));
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

    // Crear array de eventos ordenados por fecha/hora
    const events = [
      ...confirmedPurchases.map((purchase) => ({
        date: new Date(purchase.lastUpdate || purchase.registerDate),
        amount: toNumber(purchase.price),
        type: "income",
      })),
      ...confirmedRedemptions.map((redemption) => ({
        date: new Date(redemption.lastUpdate || redemption.registerDate),
        amount: -toNumber(redemption.amount),
        type: "outflow",
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calcular flujo acumulado para cada evento individual
    let cumulativeFlow = 0;
    const netFlowSeries = events.map((event) => {
      cumulativeFlow += event.amount;
      return cumulativeFlow;
    });

    const chartDates = events.map((event) =>
      event.date.toISOString().slice(0, 10),
    );

    const maxValue = Math.max(
      0,
      ...netFlowSeries,
      Math.abs(Math.min(...netFlowSeries)),
    );

    return {
      totalIncome,
      totalOutflow,
      confirmedPurchases,
      confirmedRedemptions,
      chartDates,
      netFlowSeries,
      maxValue,
      events,
    };
  }, [purchases, redemptions]);

  const netFlowPoints = buildPoints(
    dashboardData.netFlowSeries,
    dashboardData.maxValue,
  );

  const netFlowPointsString = netFlowPoints
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
                  Flujo neto acumulado
                </span>
              </div>
            </div>

            <div className="finance-chart-body">
              <span className="axis-label y-axis">Dinero (Bs)</span>
              <span className="axis-label x-axis">Tiempo</span>
              {dashboardData.chartDates.length === 0 ? (
                <div className="finance-chart-empty">
                  Sin datos confirmados para graficar.
                </div>
              ) : (
                <svg
                  className="finance-chart"
                  viewBox={`-40 -10 ${chartWidth + 50} ${chartHeight + 40}`}
                  role="img"
                  aria-label="Grafica de ingresos y egresos"
                >
                  <defs>
                    <linearGradient
                      id="flowGradient"
                      x1="0%"
                      y1="100%"
                      x2="0%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#8b4a4a" />
                      <stop offset="50%" stopColor="#3d8b40" />
                      <stop offset="100%" stopColor="#2d5f3f" />
                    </linearGradient>
                  </defs>
                  {/* Etiquetas y marcas del eje Y */}
                  {generateYAxisLabels(dashboardData.maxValue, 5).map(
                    (label, index) => (
                      <g key={`y-label-${index}`}>
                        <line
                          x1="-5"
                          y1={label.y}
                          x2="0"
                          y2={label.y}
                          className="axis-tick"
                        />
                        <text
                          x="-10"
                          y={label.y + 4}
                          className="axis-text"
                          textAnchor="end"
                        >
                          Bs {formatAmount(label.value)}
                        </text>
                      </g>
                    ),
                  )}

                  {/* Etiquetas y marcas del eje X */}
                  {generateXAxisLabels(dashboardData.chartDates, dashboardData.events, 6).map(
                    (label, index) => (
                      <g key={`x-label-${index}`}>
                        <line
                          x1={label.x}
                          y1={chartHeight}
                          x2={label.x}
                          y2={chartHeight + 5}
                          className="axis-tick"
                        />
                        <text
                          x={label.x}
                          y={chartHeight + 18}
                          className="axis-text"
                          textAnchor="middle"
                        >
                          {label.date}
                        </text>
                      </g>
                    ),
                  )}

                  {/* Eje Y (vertical) */}
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={chartHeight}
                    className="chart-axis"
                  />
                  {/* Eje X (horizontal) */}
                  <line
                    x1="0"
                    y1={chartHeight}
                    x2={chartWidth}
                    y2={chartHeight}
                    className="chart-axis"
                  />
                  {/* Línea de referencia en 0 (equilibrio) */}
                  <line
                    x1="0"
                    y1={chartHeight / 2}
                    x2={chartWidth}
                    y2={chartHeight / 2}
                    className="chart-zero-line"
                  />
                  <polyline
                    className="chart-line flow"
                    points={netFlowPointsString}
                    fill="none"
                  />
                  {netFlowPoints.map((point, index) => (
                    <circle
                      key={`flow-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      className="chart-point flow"
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
