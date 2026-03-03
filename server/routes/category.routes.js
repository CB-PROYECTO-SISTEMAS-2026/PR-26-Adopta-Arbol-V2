import { Router } from "express";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

// Obtener todas las categorías activas
router.get("/categories", getCategories);

// Crear una nueva categoría
router.post("/categories", createCategory);

// Actualizar una categoría
router.put("/categories/:id", updateCategory);

// Eliminar (desactivar) una categoría
router.delete("/categories/:id", deleteCategory);

export default router;
