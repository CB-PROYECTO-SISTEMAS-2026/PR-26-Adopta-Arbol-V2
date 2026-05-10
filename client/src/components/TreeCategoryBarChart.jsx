import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getTreesByCategory } from "../api/tree.api.js";
import "./TreeCategoryBarChart.css";

const COLORS = [
  "#2d5f3f",
  "#3d8b40",
  "#9fc7a8",
  "#1f5a3c",
  "#5a9b6e",
  "#4a7a52",
];

const formatCount = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return "0";
  return parsed.toLocaleString("es-BO");
};

export default function TreeCategoryBarChart() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getTreesByCategory();
        setStats(response.data || []);
      } catch (err) {
        console.error("Error al cargar categorías:", err);
        setError("No se pudieron cargar los datos.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  let bodyContent = null;

  if (loading) {
    bodyContent = <div className="category-state">Cargando...</div>;
  } else if (error) {
    bodyContent = <div className="category-state error">{error}</div>;
  } else if (stats.length === 0) {
    bodyContent = <div className="category-state">Sin datos disponibles.</div>;
  } else {
    bodyContent = (
      <div className="category-chart-wrapper" role="img" aria-label="Gráfica de árboles por categoría">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={stats}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(45, 95, 63, 0.1)" />
            <XAxis type="number" stroke="#6d7d6d" style={{ fontSize: "12px" }} />
            <YAxis
              dataKey="name"
              type="category"
              width={115}
              stroke="#6d7d6d"
              style={{ fontSize: "12px" }}
            />
            <Tooltip
              formatter={(value) => formatCount(value)}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid rgba(45, 95, 63, 0.2)",
                background: "#ffffff",
              }}
              cursor={{ fill: "rgba(45, 95, 63, 0.05)" }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#2d5f3f">
              {stats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="category-panel">
      <div className="finance-chart-header category-header">
        <div>
          <h3>Árboles por categoría</h3>
          <p>Distribución de árboles activos</p>
        </div>
      </div>
      <div className="finance-chart-body">
        {bodyContent}
      </div>
    </div>
  );
}
