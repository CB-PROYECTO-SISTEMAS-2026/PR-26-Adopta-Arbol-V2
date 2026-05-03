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
  const { loggedUser, updateUserCredits, refreshUserData, logout } = useUsers();
  const { showSuccess, showError, showWarning, showConfirm } =
    useNotification();

  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [showLogoutCard, setShowLogoutCard] = useState(false);
  const [showNavMenu, setShowNavMenu] = useState(false);

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

  const handleLogout = () => {
    showConfirm("¿Estás seguro de que quieres cerrar sesión?", () => {
      logout();
      window.location.replace("/");
    });
  };

  const getTreeStatusMeta = (status) => {
    const normalized = String(status ?? "")
      .trim()
      .toLowerCase();

    if (["1", "activo", "active"].includes(normalized)) {
      return { label: "Activo", className: "tree-status-active" };
    }

    if (
      ["0", "inactivo", "inhabilitado", "inactive", "disabled"].includes(
        normalized,
      )
    ) {
      return { label: "Inhabilitado", className: "tree-status-disabled" };
    }

    if (
      [
        "2",
        "pendiente",
        "en revision",
        "en revisión",
        "review",
        "pending",
      ].includes(normalized)
    ) {
      return { label: "En Revision", className: "tree-status-review" };
    }

    return {
      label: normalized ? String(status) : "Sin estado",
      className: "tree-status-unknown",
    };
  };

  const renderNavbar = () => {
    return (
      <nav className="map-navbar">
        <div className="navbar-container">
          <div className="navbar-center"></div>

          <div className="navbar-actions">
            <button
              className="btn-hamburger"
              onClick={() => {
                setShowNavMenu((prev) => !prev);
                setShowLogoutCard(false);
              }}
              aria-label="Menú"
            >
              <i className={showNavMenu ? "bi bi-x-lg" : "bi bi-list"}></i>
            </button>

            <div className="user-icon-container">
              <div
                className="user-icon"
                onClick={() => {
                  setShowLogoutCard((prev) => !prev);
                  setShowNavMenu(false);
                }}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-person-fill"></i>
              </div>
              {showLogoutCard && (
                <div className="logout-card">
                  <div className="logout-card-info">
                    <div className="navbar-points">
                      <img
                        src="/StartCoin.svg"
                        alt="points"
                        className="points-icon"
                        style={{ width: "24px", height: "24px" }}
                      />
                      <span className="points-amount">
                        {loggedUser?.point || 0}
                      </span>
                    </div>
                    <div className="navbar-credits">
                      <img
                        src="/DollarCoin.svg"
                        alt="credits"
                        className="credits-icon"
                        style={{ width: "24px", height: "24px" }}
                      />
                      <span>{loggedUser?.credits || 0}</span>
                    </div>
                  </div>
                  <button className="logout-card-button" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right"></i>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {showNavMenu && (
          <div className="navbar-menu">
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/tree-home");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-map-fill"></i>
              <span>Mapa de Árboles</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/my-trees");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-tree-fill"></i>
              <span>Mis Árboles</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/user-buy-credits");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-cart-fill"></i>
              <span>Comprar Créditos</span>
            </button>
            <button
              className="navbar-menu-item"
              onClick={() => {
                navigate("/ranking");
                setShowNavMenu(false);
              }}
            >
              <i className="bi bi-trophy-fill"></i>
              <span>Ranking</span>
            </button>
          </div>
        )}
      </nav>
    );
  };

  if (loading) {
    return (
      <div className="adopt-tree-container">
        {renderNavbar()}
        <div className="adopt-tree-state-card">
          <div className="loading">Cargando información...</div>
        </div>
      </div>
    );
  }

  if (!tree) {
    return (
      <div className="adopt-tree-container">
        {renderNavbar()}
        <div className="adopt-tree-state-card">
          <div className="error">Árbol no encontrado</div>
        </div>
      </div>
    );
  }

  const treeStatusMeta = getTreeStatusMeta(tree.status);

  return (
    <div className="adopt-tree-container">
      {renderNavbar()}

      <div className="adoption-content">
        <div className="adopt-header">
          <h1>Adopta un Árbol</h1>
          <p>
            Verifica la información del árbol que deseas adoptar y confirma tu
            solicitud
          </p>
        </div>

        {/* Información del usuario */}
        <div className="user-info-section">
          <h2>Balance de Cuenta</h2>
          <div className="credits-info">
            <span className="credits-amount text-center">
              $ {loggedUser?.credits || 0}
            </span>
          </div>

          <div className="credits-comparison tree-summary-card">
            <div className="tree-summary-row">
              <div className="tree-summary-main">
                <div className="tree-summary-name-row">
                  <h3 className="tree-summary-name">{tree.name}</h3>
                  <span
                    className={`tree-status-badge ${treeStatusMeta.className}`}
                  >
                    {treeStatusMeta.label}
                  </span>
                </div>
                <h4 className="tree-summary-code">{tree.code}</h4>
              </div>

              <p className="tree-summary-price">
                <strong>$ </strong>
                {Number(tree.price)}
              </p>
            </div>
          </div>

          {/* Mostrar información de créditos necesarios */}
          <div className="credits-comparison">
            <div className="d-flex justify-content-between">
              <p>
                <strong>Costo del árbol:</strong>
              </p>
              <p>{Number(tree.price)} créditos</p>
            </div>

            <div className="d-flex justify-content-between">
              <p>
                <strong>Diferencia:</strong>
              </p>
              <p>
                {Number(loggedUser?.credits || 0) - Number(tree.price)} créditos
              </p>
            </div>

            <div className="d-flex justify-content-between">
              <p>
                <strong>Bonus de Puntos:</strong>
              </p>
              <p>{Math.round(Number(tree.price) * 0.15)} puntos</p>
            </div>
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

        <div className="adoption-info">
          <h3>Información importante:</h3>
          <ul>
            <li>Tu solicitud será revisada por un administrador</li>
            <li>
              Al confirmar la solicitud se descontarán {tree.price} créditos de
              tu cuenta
            </li>
            <li>Recibirás notificación cuando tu adopción sea aprobada</li>
            <li>Podrás ver el historial del árbol una vez adoptado</li>
          </ul>
        </div>

        <div className="action-buttons">
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
      </div>
    </div>
  );
}
