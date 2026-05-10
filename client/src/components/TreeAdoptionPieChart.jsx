import { useEffect, useMemo, useState } from "react";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { getAdoptionStats } from "../api/tree.api.js";
import "./TreeAdoptionPieChart.css";

const formatCount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0";
  return parsed.toLocaleString("es-BO");
};

export default function TreeAdoptionPieChart() {
  const [stats, setStats] = useState({
    adoptedTrees: 0,
    notAdoptedTrees: 0,
    totalTrees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getAdoptionStats();
        setStats(response.data);
      } catch (err) {
        console.error("Error al cargar estadisticas:", err);
        setError("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const { adoptedTrees, notAdoptedTrees, totalTrees } = stats;

  const chartData = useMemo(
    () => [
      {
        name: "Adoptados",
        value: adoptedTrees,
        color: "#2d5f3f",
      },
      {
        name: "No adoptados",
        value: notAdoptedTrees,
        color: "#9fc7a8",
      },
    ],
    [adoptedTrees, notAdoptedTrees],
  );

  const renderCenterLabel = ({ viewBox }) => {
    if (!viewBox) return null;

    const { cx, cy } = viewBox;

    return (
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
        <tspan x={cx} y={cy - 6} className="adoption-center-value">
          {formatCount(totalTrees)}
        </tspan>
        <tspan x={cx} y={cy + 16} className="adoption-center-label">
          Activos
        </tspan>
      </text>
    );
  };

  let bodyContent = null;

  if (loading) {
    bodyContent = <div className="adoption-state">Cargando...</div>;
  } else if (error) {
    bodyContent = <div className="adoption-state error">{error}</div>;
  } else if (totalTrees === 0) {
    bodyContent = (
      <div className="adoption-state">Sin datos disponibles.</div>
    );
  } else {
    bodyContent = (
      <div className="adoption-content">
        <div className="adoption-chart-area" role="img" aria-label="Grafica de adopcion de arboles">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                formatter={(value, name) => [formatCount(value), name]}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(45, 95, 63, 0.2)",
                  background: "#ffffff",
                }}
              />
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                stroke="#ffffff"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
                <Label content={renderCenterLabel} />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="adoption-metrics d-flex justify-content-between">
          <div className="adoption-metric">
            <span className="adoption-dot adopted"></span>
            <div className="adoption-metric-info">
              <span className="adoption-metric-label">Adoptados <span className="adoption-metric-value">
                {formatCount(adoptedTrees)}
              </span></span>
            </div>
          </div>
          <div className="adoption-metric">
            <span className="adoption-dot not-adopted"></span>
            <div className="adoption-metric-info">
              <span className="adoption-metric-label">No adoptados <span className="adoption-metric-value">
                {formatCount(notAdoptedTrees)}
              </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="adoption-panel">
      <div className="finance-chart-header adoption-header">
        <div>
          <h3>Adopción de árboles</h3>
          <p>Registro de adopción de árboles activos</p>
        </div>
      </div>
      {bodyContent}
    </div>
  );
}
