import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUsers } from "../context/UserContext";
import { useNotification } from "../context/NotificationContext.jsx";
import { getAllTreesWithAdoptionStatus } from "../api/tree.api";
import { createAdoptionRequest } from "../api/adoption.api";
import { refreshUserDataRequest } from "../api/user.api";
import "./AdoptTree.css";

export default function AdoptTree() {
  const { treeId } = useParams();
  const navigate = useNavigate();
  const { loggedUser, updateUserCredits, refreshUserData } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } =
    useNotification();

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    loadTreeData();
  }, [treeId]);

  const loadTreeData = async () => {
    try {
      setLoading(true);

      // Refrescar datos del usuario para asegurar sincronización
      if (loggedUser?.id) {
        try {
          await refreshUserData();
          console.log("Datos del usuario refrescados al cargar la página");
        } catch (refreshError) {
          console.error("Error al refrescar datos del usuario:", refreshError);
        }
      }

      // Debug: Mostrar información del usuario logueado
      console.log("Usuario logueado:", loggedUser);
      console.log("Créditos del usuario:", loggedUser?.credits);

      // Cargar árbol específico
      const treesResponse = await getAllTreesWithAdoptionStatus();
      const foundTree = treesResponse.data.find((t) => t.id == treeId);

      if (!foundTree) {
        showError("Árbol no encontrado");
        navigate("/home");
        return;
      }

      if (foundTree.isAdopted) {
        showWarning("Este árbol ya está adoptado");
        navigate("/home");
        return;
      }

      console.log("Árbol encontrado:", foundTree);
      console.log("Precio del árbol:", foundTree.price);
      setTree(foundTree);

      // QR removido - no se necesita para la adopción
    } catch (error) {
      console.error("Error al cargar datos:", error);
      showError("Error al cargar información del árbol");
      navigate("/home");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAdoption = async () => {
    if (!tree || !loggedUser) return;

    // Debug: Verificar estado del usuario
    console.log("=== DEBUG ADOPCIÓN ===");
    console.log("loggedUser:", loggedUser);
    console.log("loggedUser.id:", loggedUser?.id);
    console.log("typeof loggedUser.id:", typeof loggedUser?.id);

    // Refrescar datos del usuario antes de la validación para asegurar datos actualizados
    let currentUser = loggedUser;

    // Debug: Mostrar estado completo del usuario
    console.log("=== DEBUG ESTADO DEL USUARIO ===");
    console.log("loggedUser completo:", loggedUser);
    console.log("loggedUser.id:", loggedUser?.id);
    console.log("typeof loggedUser.id:", typeof loggedUser?.id);
    console.log("loggedUser.id === undefined:", loggedUser?.id === undefined);
    console.log("loggedUser.id === null:", loggedUser?.id === null);
    console.log(
      "loggedUser.id === 'undefined':",
      loggedUser?.id === "undefined",
    );

    // Verificar que tenemos un ID válido antes de hacer la petición
    if (
      loggedUser?.id &&
      loggedUser.id !== undefined &&
      loggedUser.id !== null &&
      loggedUser.id !== "undefined"
    ) {
      try {
        console.log(
          "Intentando refrescar datos del usuario con ID:",
          loggedUser.id,
        );
        // Obtener datos actualizados directamente de la API
        const response = await refreshUserDataRequest(loggedUser.id);
        currentUser = response.data;
        // Actualizar el contexto también
        await refreshUserData();
        console.log("Datos del usuario refrescados antes de la validación");
      } catch (refreshError) {
        console.error("Error al refrescar datos del usuario:", refreshError);
        // Si falla el refresh, usar los datos actuales
        currentUser = loggedUser;
      }
    } else {
      console.warn(
        "No se pudo refrescar datos del usuario: ID no disponible o inválido",
      );
      console.warn("ID value:", loggedUser?.id);

      // Si no tenemos un ID válido, no podemos continuar
      console.error("No se puede continuar: ID de usuario no disponible");
      showError(
        "Error: No se pudieron cargar los datos del usuario. Por favor, recarga la página e intenta nuevamente.",
      );
      return;
    }

    // Verificar que tenemos datos válidos del usuario
    if (!currentUser || !currentUser.id) {
      showError(
        "Error: No se pudieron cargar los datos del usuario. Por favor, recarga la página.",
      );
      return;
    }

    // Verificar créditos antes de proceder
    if (Number(currentUser.credits) < Number(tree.price)) {
      showWarning(
        `No tienes suficientes créditos. Necesitas ${Number(tree.price)} créditos pero solo tienes ${Number(currentUser.credits)}.`,
      );
      return;
    }

    showConfirm(
      `¿Estás seguro de que quieres adoptar el árbol "${tree.name}" por ${tree.price} créditos?`,
      async () => {
        try {
          setConfirming(true);

          const adoptionData = {
            userId: Number(currentUser.id),
            treeId: Number(tree.id),
            status: 2, // Pendiente
          };

          console.log("Datos de adopción a enviar:", adoptionData);
          console.log("Tipos de datos:", {
            userId: typeof adoptionData.userId,
            treeId: typeof adoptionData.treeId,
            status: typeof adoptionData.status,
          });

          await createAdoptionRequest(adoptionData);

          // Refrescar datos del usuario desde la base de datos para sincronizar créditos
          try {
            await refreshUserData();
            console.log(
              "Datos del usuario actualizados desde la base de datos",
            );
          } catch (refreshError) {
            console.error(
              "Error al refrescar datos del usuario:",
              refreshError,
            );
            // Fallback: actualizar créditos localmente
            const newCredits = Number(currentUser.credits) - Number(tree.price);
            updateUserCredits(newCredits);
          }

          showSuccess(
            "¡Solicitud de adopción enviada exitosamente! Los créditos han sido descontados. Espera la aprobación del administrador.",
          );
          navigate("/home");
        } catch (error) {
          console.error("Error al crear adopción:", error);
          console.error("Detalles del error:", error.response?.data);
          console.error("Mensaje del servidor:", error.response?.data?.message);

          const errorMessage =
            error.response?.data?.message ||
            "Error al procesar la adopción. Inténtalo nuevamente.";
          showError(`Error: ${errorMessage}`);
        } finally {
          setConfirming(false);
        }
      },
    );
  };

  const handleCancel = () => {
    navigate("/home");
  };

  if (loading) {
    return (
      <div className="adopt-tree-container">
        <div className="loading">Cargando información...</div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="adopt-tree-container">
        <div className="error">Árbol no encontrado</div>
      </div>
    );
  }

  return (
    <div className="adopt-tree-container">
      <header className="adopt-header">
        <button className="back-btn" onClick={handleCancel}>
          ← Volver
        </button>
        <h1>Adoptar Árbol</h1>
      </header>

      <div className="adoption-content">
        {/* Información del árbol */}
        <div className="tree-info-section">
          <h2>Información del Árbol</h2>
          <div className="tree-card">
            <div className="tree-icon">
              <img
                src="/StartCoin.svg"
                alt="coin"
                style={{ width: "28px", height: "28px" }}
              />
            </div>
            <div className="tree-details">
              <h3>{tree.name}</h3>
              <p>
                <strong>Código:</strong> {tree.code}
              </p>
              <p>
                <strong>Ubicación:</strong> {tree.address}
              </p>
              <p>
                <strong>Precio:</strong>{" "}
                <span className="price">{tree.price} créditos</span>
              </p>
              {tree.description && (
                <p>
                  <strong>Descripción:</strong> {tree.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Información del usuario */}
        <div className="user-info-section">
          <h2>Tus Créditos</h2>
          <div className="credits-display">
            <div className="credits-icon">💰</div>
            <div className="credits-info">
              <span className="credits-amount">{loggedUser?.credits || 0}</span>
              <span className="credits-label">créditos disponibles</span>
            </div>
          </div>

          {/* Mostrar información de créditos necesarios */}
          <div className="credits-comparison">
            <p>
              <strong>Costo del árbol:</strong> {Number(tree.price)} créditos
            </p>
            <p>
              <strong>Tus créditos:</strong> {Number(loggedUser?.credits || 0)}{" "}
              créditos
            </p>
            <p>
              <strong>Diferencia:</strong>
              <span
                className={
                  Number(tree.price) <= Number(loggedUser?.credits || 0)
                    ? "sufficient-credits"
                    : "insufficient-credits-text"
                }
              >
                {Number(tree.price) <= Number(loggedUser?.credits || 0)
                  ? `✅ Suficientes créditos (sobran ${Number(loggedUser?.credits || 0) - Number(tree.price)})`
                  : `❌ Faltan ${Number(tree.price) - Number(loggedUser?.credits || 0)} créditos`}
              </span>
            </p>
          </div>

          {Number(tree.price) > Number(loggedUser?.credits || 0) && (
            <div className="insufficient-credits">
              <p>⚠️ No tienes suficientes créditos para adoptar este árbol.</p>
              <p>
                Necesitas{" "}
                {Number(tree.price) - Number(loggedUser?.credits || 0)} créditos
                más.
              </p>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="action-buttons">
          <button
            className="btn-cancel"
            onClick={handleCancel}
            disabled={confirming}
          >
            Cancelar
          </button>
          <button
            className="btn-confirm"
            onClick={handleConfirmAdoption}
            disabled={
              confirming ||
              Number(tree.price) > Number(loggedUser?.credits || 0)
            }
          >
            {confirming ? "Procesando..." : "Confirmar Adopción"}
          </button>
        </div>

        {/* Información adicional */}
        <div className="adoption-info">
          <h3>Información importante:</h3>
          <ul>
            <li>Tu solicitud será revisada por un administrador</li>
            <li>
              Se descontarán {tree.price} créditos de tu cuenta al ser aprobada
            </li>
            <li>Recibirás notificación cuando tu adopción sea aprobada</li>
            <li>Podrás ver el historial del árbol una vez adoptado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
