import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import { getMyTrees } from "../api/tree.api";
import { createIrrigationRequest } from "../api/irrigation.api";
import { getStaticUrl } from "../config/api.config.js";
import "./IrrigateTree.css";

export default function IrrigateTree() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { loggedUser, refreshUserData } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } = useNotification();
  
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTreeData();
  }, [treeId]);

  const loadTreeData = async () => {
    try {
      setLoading(true);
      
      // Cargar árboles del usuario
      const response = await getMyTrees(loggedUser?.id);
      const foundTree = response.data.find(t => t.id == treeId);
      
      if (!foundTree) {
        showError("Árbol no encontrado");
        navigate("/my-trees");
        return;
      }

      if (foundTree.adoptionStatus !== 1) {
        showWarning("Solo puedes regar árboles aprobados");
        navigate("/my-trees");
        return;
      }

      setTree(foundTree);
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showError("Error al cargar información del árbol");
      navigate("/my-trees");
    } finally {
      setLoading(false);
    }
  };


  const handleSubmitIrrigation = async () => {
    if (!tree || !loggedUser) return;

    // Calcular recompensa: 15% del precio del árbol
    const reward = Math.round(parseFloat(tree.price) * 0.15 * 100) / 100;

    showConfirm(
      `¿Estás seguro de que quieres regar el árbol "${tree.name}"?\n\nRecibirás ${reward} puntos por este riego.`,
      async () => {
        try {
          setSubmitting(true);
          
          const irrigationData = {
            userId: Number(loggedUser.id),
            treeId: Number(tree.id)
          };

          console.log("Datos de riego a enviar:", irrigationData);

          const response = await createIrrigationRequest(irrigationData);
          
          showSuccess(`¡Riego registrado exitosamente!\n\nHas ganado ${response.data.reward} puntos por regar este árbol.`);
          navigate("/my-trees");
        } catch (error) {
          console.error("Error al enviar riego:", error);
          console.error("Detalles del error:", error.response?.data);
          
          const errorMessage = error.response?.data?.message || "Error al procesar el riego. Inténtalo nuevamente.";
          showError(`Error: ${errorMessage}`);
        } finally {
          setSubmitting(false);
        }
      }
    );
  };

  const handleCancel = () => {
    navigate("/my-trees");
  };

  if (loading) {
    return (
      <div className="irrigate-tree-container">
        <div className="loading">Cargando información...</div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="irrigate-tree-container">
        <div className="error">Árbol no encontrado</div>
      </div>
    );
  }

  return (
    <div className="irrigate-tree-container">
      <header className="irrigate-header">
        <button className="back-btn" onClick={handleCancel}>
          ← Volver
        </button>
        <h1>Regar Árbol</h1>
      </header>

      <div className="irrigation-content">
        {/* Información del árbol */}
        <div className="tree-info-section">
          <h2>Información del Árbol</h2>
          <div className="tree-card">
            <div className="tree-image">
              {tree.imagePath ? (
                <img 
                  src={getStaticUrl(tree.imagePath)} 
                  alt={tree.name}
                  onError={(e) => {
                    e.target.src = '/default-tree.svg';
                  }}
                />
              ) : (
                <div className="image-placeholder">
                  <span className="tree-icon">🌳</span>
                </div>
              )}
            </div>
            <div className="tree-details">
              <h3>{tree.name}</h3>
              <p><strong>Código:</strong> {tree.code}</p>
              <p><strong>Ubicación:</strong> {tree.address}</p>
              {tree.description && (
                <p><strong>Descripción:</strong> {tree.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Información de recompensa */}
        <div className="irrigation-form-section">
          <h2>Regar Árbol</h2>
          
          <div className="irrigation-info-card">
            <div className="irrigation-icon">💧</div>
            <div className="irrigation-text">
              <h3>¿Has regado tu árbol?</h3>
              <p>Confirma que has regado tu árbol para recibir puntos de recompensa.</p>
            </div>
          </div>

          {/* Información de recompensa */}
          <div className="reward-info">
            <h3>Recompensa</h3>
            <div className="reward-display">
              <span className="reward-icon">⭐</span>
              <span className="reward-amount">{Math.round(parseFloat(tree.price) * 0.15 * 100) / 100} puntos</span>
              <span className="reward-text">por riego (15% del precio del árbol)</span>
            </div>
            <p className="reward-note">
              Los puntos se otorgan inmediatamente al confirmar el riego.
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="action-buttons">
          <button 
            className="btn-cancel" 
            onClick={handleCancel}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button 
            className="btn-submit" 
            onClick={handleSubmitIrrigation}
            disabled={submitting}
          >
            {submitting ? "Registrando..." : "Confirmar Riego"}
          </button>
        </div>

        {/* Información adicional */}
        <div className="irrigation-info">
          <h3>Información importante:</h3>
          <ul>
            <li>Solo puedes regar árboles que hayas adoptado y que estén aprobados</li>
            <li>Recibirás puntos inmediatamente al confirmar el riego</li>
            <li>La recompensa es el 15% del precio del árbol </li>
            <li>Puedes regar el mismo árbol múltiples veces</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
