import axios from "axios";
import { API_URL } from "../config/api.config.js";

// Función para obtener todos los árboles con estado 2
export const getTreesRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/trees`); // Llama al backend para obtener los árboles con estado 2
    return response; // Devuelve la respuesta con los árboles
  } catch (error) {
    console.error("Error al obtener los árboles:", error);
    throw error; // Lanza el error para ser manejado en el componente
  }
};

// Función para obtener todos los árboles sin importar su status (admin)
export const getAllTreesForAdminRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/trees/admin/all`);
    return response;
  } catch (error) {
    console.error("Error al obtener todos los árboles:", error);
    throw error;
  }
};

// Función para cambiar el estado de un árbol a 1 (activo)
export const setTreeStateToActive = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/trees/${id}/activate`); // Llama al backend para cambiar el estado a 1 (activo)
    return response; // Devuelve la respuesta de la activación
  } catch (error) {
    console.error("Error al activar el árbol:", error);
    throw error; // Lanza el error para ser manejado en el componente
  }
};

// Función para cambiar el estado de un árbol a 0 (inactivo)
export const setTreeStateToInactive = async (id) => {
  try {
    const response = await axios.put(`${API_URL}/trees/${id}/deactivate`); // Llama al backend para cambiar el estado a 0 (inactivo)
    return response; // Devuelve la respuesta de la desactivación
  } catch (error) {
    console.error("Error al desactivar el árbol:", error);
    throw error; // Lanza el error para ser manejado en el componente
  }
};

// Función para obtener todos los árboles con información de adopción
export const getAllTreesWithAdoptionStatus = async () => {
  try {
    const response = await axios.get(`${API_URL}/trees/all-with-adoption`);
    return response;
  } catch (error) {
    console.error("Error al obtener árboles con estado de adopción:", error);
    throw error;
  }
};

// Función para obtener historial de un árbol específico
export const getTreeHistory = async (treeId) => {
  try {
    const response = await axios.get(`${API_URL}/trees/${treeId}/history`);
    return response;
  } catch (error) {
    console.error("Error al obtener historial del árbol:", error);
    throw error;
  }
};

// Función para obtener los árboles adoptados por el usuario actual
export const getMyTrees = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/trees/my-trees`, {
      headers: {
        "user-id": userId,
      },
    });
    return response;
  } catch (error) {
    console.error("Error al obtener mis árboles:", error);
    throw error;
  }
};

// Función para renombrar un árbol
export const renameTree = async (treeId, newName, userId) => {
  try {
    const response = await axios.put(
      `${API_URL}/trees/${treeId}/rename`,
      {
        name: newName,
      },
      {
        headers: {
          "user-id": userId,
        },
      },
    );
    return response;
  } catch (error) {
    console.error("Error al renombrar el árbol:", error);
    throw error;
  }
};

// Función para abandonar un árbol (eliminar de mis árboles)
export const abandonTree = async (treeId, userId) => {
  try {
    const response = await axios.delete(`${API_URL}/trees/${treeId}/abandon`, {
      headers: {
        "user-id": userId,
      },
    });
    return response;
  } catch (error) {
    console.error("Error al abandonar el árbol:", error);
    throw error;
  }
};
