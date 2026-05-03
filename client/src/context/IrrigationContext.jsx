import { createContext, useContext, useState } from "react";
import {
  getIrrigationsRequest,
  getIrrigationRequest,
  approveIrrigationRequest,
  rejectIrrigationRequest,
} from "../api/irrigation.api.js";

export const IrrigationContext = createContext();

// Custom hook para usar el contexto
export const useIrrigations = () => {
  const context = useContext(IrrigationContext);

  if (!context) {
    throw new Error(
      "useIrrigations must be used within an IrrigationContextProvider",
    );
  }
  return context;
};

// Proveedor del contexto
export const IrrigationContextProvider = ({ children }) => {
  // Estados
  const [irrigations, setIrrigations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar riegos pendientes
  async function loadIrrigations() {
    try {
      setLoading(true);
      setError(null);
      const response = await getIrrigationsRequest();
      setIrrigations(response.data);
      console.log("Riegos cargados:", response.data);
    } catch (error) {
      setError(error.message);
      console.error("Error loading irrigations:", error);
    } finally {
      setLoading(false);
    }
  }

  // Obtener un riego específico
  const getIrrigation = async (id) => {
    try {
      setError(null);
      const response = await getIrrigationRequest(id);
      return response.data;
    } catch (error) {
      setError(error.message);
      console.error("Error getting irrigation:", error);
      throw error;
    }
  };

  // Aprobar riego
  const approveIrrigation = async (id) => {
    try {
      setError(null);
      const response = await approveIrrigationRequest(id);
      // Remover el riego de la lista ya que ya no está pendiente
      setIrrigations(irrigations.filter((irrigation) => irrigation.id !== id));
      console.log("Riego aprobado:", response.data);
      return {
        success: true,
        message: "Riego aprobado exitosamente y recompensas aplicadas",
        data: response.data,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      console.error("Error approving irrigation:", error);
      return {
        success: false,
        message: errorMsg,
        error: error,
      };
    }
  };

  // Rechazar riego
  const rejectIrrigation = async (id) => {
    try {
      setError(null);
      const response = await rejectIrrigationRequest(id);
      // Remover el riego de la lista ya que ya no está pendiente
      setIrrigations(irrigations.filter((irrigation) => irrigation.id !== id));
      console.log("Riego rechazado:", response.data);
      return {
        success: true,
        message: "Riego rechazado exitosamente",
        data: response.data,
      };
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.message;
      setError(errorMsg);
      console.error("Error rejecting irrigation:", error);
      return {
        success: false,
        message: errorMsg,
        error: error,
      };
    }
  };

  return (
    <IrrigationContext.Provider
      value={{
        irrigations,
        loading,
        error,
        loadIrrigations,
        getIrrigation,
        approveIrrigation,
        rejectIrrigation,
      }}
    >
      {children}
    </IrrigationContext.Provider>
  );
};
