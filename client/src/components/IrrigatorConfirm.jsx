import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./IrrigatorConfirm.css";
import { confirmIrrigationRequest, getIrrigationRequest } from "../api/irrigation.api.js";
import { useUsers } from "../context/UserContext.jsx";
import { useNotification } from "../context/NotificationContext.jsx";

export default function IrrigatorConfirm() {
  const navigate = useNavigate();
  const { id } = useParams(); // ID del riego
  const { loggedUser, logout } = useUsers();
  const { showSuccess, showError, showWarning } = useNotification();

  const [treeName, setTreeName] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [observations, setObservations] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar información del riego
  useEffect(() => {
    const loadIrrigationInfo = async () => {
      try {
        const data = await getIrrigationRequest(id);
        // getIrrigationRequest ya retorna response.data directamente
        setTreeName(data?.treeName || "Árbol");
      } catch (error) {
        console.error("Error al cargar información del riego:", error);
        showError("Error al cargar la información del riego");
      }
    };

    if (id) {
      loadIrrigationInfo();
    }
  }, [id, showError]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleConfirmIrrigation = async () => {
    if (!image) {
      showWarning("Por favor adjunta una imagen de evidencia del riego 📷");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("evidence", image);
      formData.append("observations", observations);
      formData.append("irrigationId", id);

      await confirmIrrigationRequest(id, formData);
      showSuccess("✅ Riego confirmado exitosamente!");
      navigate("/regador/map");
    } catch (error) {
      console.error("Error al confirmar riego:", error);
      showError(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="irrigator-confirm-container">
      {/* Barra superior */}
      <div className="top-bar">
        <button className="btn-back" onClick={() => navigate("/regador/map")}>
          ← Volver
        </button>
        <span className="greeting">{loggedUser?.name || "Soni_w"}</span>
        <div className="top-buttons">
          <button className="btn-canjear-header">CANJEAR</button>
          <button className="btn-ranking" onClick={() => navigate("/ranking")}>
            Ranking 👑
          </button>
          <button className="btn-user-icon">👤</button>
          <button className="btn-coin">🪙</button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="content-wrapper">
        <h1 className="title">Regar-Arboles-REGADOR</h1>

        {/* Vista previa de la imagen */}
        <div className="image-preview-section">
          {preview ? (
            <img src={preview} alt="Evidencia" className="evidence-image" />
          ) : (
            <div className="placeholder-image">
              <span>📷</span>
              <p>Vista previa de la imagen</p>
            </div>
          )}
        </div>

        {/* Información del árbol */}
        <div className="tree-info-row">
          <div className="info-label">Especie:</div>
          <div className="info-value">{treeName}</div>
        </div>

        {/* Botón adjuntar imagen */}
        <input
          type="file"
          id="evidenceInput"
          accept="image/*"
          onChange={handleImageChange}
          hidden
        />
        <button
          className="btn-attach-image"
          onClick={() => document.getElementById("evidenceInput").click()}
        >
          Adjuntar imagen 📎
        </button>

        {/* Observaciones */}
        <div className="observations-section">
          <label className="observations-label">Observaciones:</label>
          <textarea
            className="observations-textarea"
            placeholder="Escribe tus observaciones aquí (opcional)..."
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            rows={5}
          />
        </div>

        {/* Botón confirmar */}
        <button
          className="btn-confirm"
          onClick={handleConfirmIrrigation}
          disabled={loading}
        >
          {loading ? "Confirmando..." : "Confirmar riego de planta"}
        </button>

        {/* Copyright */}
        <div className="copyright">
        © 2025 Adopta, todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}

