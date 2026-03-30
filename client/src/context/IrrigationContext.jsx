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
    throw new Error("useIrrigations must be used within an IrrigationContextProvider");
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
      const data = await getIrrigationsRequest();
      // getIrrigationsRequest ya retorna el data directamente (response.data)
      setIrrigations(Array.isArray(data) ? data : []);
      console.log("Riegos cargados:", data);
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
      const data = await getIrrigationRequest(id);
      // getIrrigationRequest ya retorna el data directamente (response.data)
      return data;
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
      const data = await approveIrrigationRequest(id);
      // approveIrrigationRequest ya retorna el data directamente (response.data)
      // Remover el riego de la lista ya que ya no está pendiente
      setIrrigations(irrigations.filter((irrigation) => irrigation.id !== id));
      console.log("Riego aprobado:", data);
      return data;
    } catch (error) {
      setError(error.message);
      console.error("Error approving irrigation:", error);
      throw error;
    }
  };

  // Rechazar riego
  const rejectIrrigation = async (id) => {
    try {
      setError(null);
      const data = await rejectIrrigationRequest(id);
      // rejectIrrigationRequest ya retorna el data directamente (response.data)
      // Remover el riego de la lista ya que ya no está pendiente
      setIrrigations(irrigations.filter((irrigation) => irrigation.id !== id));
      console.log("Riego rechazado:", data);
      return data;
    } catch (error) {
      setError(error.message);
      console.error("Error rejecting irrigation:", error);
      throw error;
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


