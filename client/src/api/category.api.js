import axios from "axios";
import { API_URL } from "../config/api.config.js";

// Función para obtener todas las categorías activas
export const getCategoriesRequest = async () => {
  try {
    const response = await axios.get(`${API_URL}/categories`);
    return response;
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    throw error;
  }
};

// Función para crear una nueva categoría
export const createCategoryRequest = async (categoryData) => {
  try {
    const response = await axios.post(`${API_URL}/categories`, categoryData);
    return response;
  } catch (error) {
    console.error("Error al crear la categoría:", error);
    throw error;
  }
};

// Función para actualizar una categoría
export const updateCategoryRequest = async (id, categoryData) => {
  try {
    const response = await axios.put(
      `${API_URL}/categories/${id}`,
      categoryData
    );
    return response;
  } catch (error) {
    console.error("Error al actualizar la categoría:", error);
    throw error;
  }
};

// Función para eliminar (desactivar) una categoría
export const deleteCategoryRequest = async (id, userId) => {
  try {
    const response = await axios.delete(`${API_URL}/categories/${id}`, {
      data: { userId },
    });
    return response;
  } catch (error) {
    console.error("Error al eliminar la categoría:", error);
    throw error;
  }
};
