import express from "express";
import { registerTree, getCategories, upload } from "../controllers/tec.controller.js";

const router = express.Router();

// Subida de imágenes + registro de árbol
router.post("/trees/register", upload.array("images", 5), registerTree);

// Obtener categorías activas
router.get("/categories", getCategories);

export default router;
