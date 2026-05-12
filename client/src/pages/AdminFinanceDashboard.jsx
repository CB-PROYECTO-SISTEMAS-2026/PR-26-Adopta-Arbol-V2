import { useEffect, useMemo, useState } from "react";
import "./AdminFinanceDashboard.css";
import { getAllPurchases } from "../api/credit.api.js";
import { getPendingRedemptions } from "../api/redemption.api.js";
import TreeAdoptionPieChart from "../components/TreeAdoptionPieChart.jsx";
import TreeCategoryBarChart from "../components/TreeCategoryBarChart.jsx";
import TopCreditPurchases from "../components/TopCreditPurchases.jsx";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

const formatChartDate = (value) => {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
};

export default function AdminFinanceDashboard() {
  const [purchases, setPurchases] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

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

        // Establecer fechas por defecto: últimos 30 días
        const today = new Date();
        const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const endDateStr = today.toISOString().slice(0, 10);
        const startDateStr = thirtyDaysAgo.toISOString().slice(0, 10);

        setEndDate(endDateStr);
        setStartDate(startDateStr);
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

    // Crear array de eventos ordenados por fecha/hora
    const events = [
      ...confirmedPurchases.map((purchase) => ({
        date: new Date(purchase.lastUpdate || purchase.registerDate),
        amount: toNumber(purchase.price),
      })),
      ...confirmedRedemptions.map((redemption) => ({
        date: new Date(redemption.lastUpdate || redemption.registerDate),
        amount: -toNumber(redemption.amount),
      })),
    ].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Filtrar eventos según el rango de fechas seleccionado
    const startDateObj = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const endDateObj = endDate ? new Date(`${endDate}T23:59:59`) : null;

    const filteredEvents = events.filter((event) => {
      if (startDateObj && event.date < startDateObj) return false;
      if (endDateObj && event.date > endDateObj) return false;
      return true;
    });

    // Calcular flujo acumulado para cada evento individual
    let cumulativeFlow = 0;
    const netFlowSeries = filteredEvents.map((event) => {
      cumulativeFlow += event.amount;
      return cumulativeFlow;
    });

    const chartDates = filteredEvents.map((event) =>
      event.date.toISOString().slice(0, 10),
    );

    const chartData = filteredEvents.map((event, index) => ({
      date: event.date.toISOString().slice(0, 10),
      netFlow: netFlowSeries[index],
    }));

    const maxAbsFlow = chartData.reduce(
      (maxValue, point) => Math.max(maxValue, Math.abs(point.netFlow)),
      0,
    );

    const yDomain = maxAbsFlow === 0 ? [-1, 1] : [-maxAbsFlow, maxAbsFlow];

    // Calcular totales para el rango de fechas (ingresos/egresos totales en el rango)
    const totalIncome = filteredEvents
      .filter((e) => e.amount > 0)
      .reduce((sum, e) => sum + e.amount, 0);

    const totalOutflow = filteredEvents
      .filter((e) => e.amount < 0)
      .reduce((sum, e) => sum + Math.abs(e.amount), 0);

    return {
      totalIncome,
      totalOutflow,
      confirmedPurchases,
      confirmedRedemptions,
      chartDates,
      chartData,
      yDomain,
    };
  }, [purchases, redemptions, startDate, endDate]);

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

          <section className="finance-chart-grid">
            <section className="finance-chart-card">
              <div className="finance-chart-header">
                <div>
                  <h3>Grafica de flujo de dinero</h3>
                  <p>
                    Registra compras aprobadas y retiros confirmados a lo largo del
                    tiempo.
                  </p>
                  <div className="date-input-group-dashboard d-flex justify-content-between">
                    <div className="date-input-wrapper">
                      <label htmlFor="start-date">Desde:</label>
                      <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="finance-date-input"
                      />
                    </div>
                    <div className="date-input-wrapper">
                      <label htmlFor="end-date">Hasta:</label>
                      <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="finance-date-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="finance-chart-body">
                {dashboardData.chartDates.length === 0 ? (
                  <div className="finance-chart-empty">
                    Sin datos confirmados para graficar.
                  </div>
                ) : (
                  <div className="finance-chart-wrapper" role="img" aria-label="Grafica de ingresos y egresos">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart
                        data={dashboardData.chartData}
                        margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="financeFlowGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2d5f3f" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#2d5f3f" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" stroke="rgba(109, 125, 109, 0.28)" />
                        <XAxis
                          dataKey="date"
                          tickLine={false}
                          axisLine={false}
                          minTickGap={24}
                          tickFormatter={formatChartDate}
                          tick={{ fill: "#6d7d6d", fontSize: 11, fontWeight: 600 }}
                        />
                        <YAxis
                          width={92}
                          domain={dashboardData.yDomain}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `Bs ${formatAmount(value)}`}
                          tick={{ fill: "#6d7d6d", fontSize: 11, fontWeight: 600 }}
                        />
                        <Tooltip
                          formatter={(value) => [`Bs ${formatAmount(value)}`, "Flujo neto"]}
                          labelFormatter={(value) => `Fecha: ${formatChartDate(value)}`}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid rgba(45, 95, 63, 0.2)",
                            background: "#ffffff",
                          }}
                        />
                        <ReferenceLine y={0} stroke="rgba(109, 125, 109, 0.5)" strokeDasharray="6 6" />
                        <Area
                          type="linear"
                          dataKey="netFlow"
                          name="Flujo neto"
                          stroke="#2d5f3f"
                          strokeWidth={3}
                          fill="url(#financeFlowGradient)"
                          dot={{ r: 3, strokeWidth: 2, stroke: "#ffffff", fill: "#2d5f3f" }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </section>

            <section className="finance-chart-card finance-adoption-card">
              <TreeAdoptionPieChart />
            </section>
          </section>

          <section className="finance-chart-grid">
            <section className="finance-chart-card">
              <TreeCategoryBarChart />
            </section>

            <section className="finance-chart-card">
              <TopCreditPurchases />
            </section>
          </section>
        </>
      )}
    </div>
  );
}
