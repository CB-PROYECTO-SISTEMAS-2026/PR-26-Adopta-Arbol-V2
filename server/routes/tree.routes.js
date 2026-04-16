import express from "express";
import {
  getTrees,
  setTreeStateToActive,
  setTreeStateToInactive,
  getAllTreesWithAdoptionStatus,
  getAllTreesForAdmin,
  getTreeHistory,
  getMyTrees,
  renameTree,
  abandonTree,
} from "../controllers/tree.controller.js";

const router = express.Router();

// Ruta para obtener TODOS los árboles sin importar status (admin)
router.get("/trees/admin/all", getAllTreesForAdmin);

// Ruta para obtener los árboles con estado 2
router.get("/trees", getTrees);

// Ruta para obtener todos los árboles con estado de adopción
router.get("/trees/all-with-adoption", getAllTreesWithAdoptionStatus);

// Ruta para obtener historial de un árbol
router.get("/trees/:treeId/history", getTreeHistory);

// Ruta para cambiar el estado de un árbol a 1 (activo)
router.put("/trees/:id/activate", setTreeStateToActive);

// Ruta para cambiar el estado de un árbol a 0 (inactivo)
router.put("/trees/:id/deactivate", setTreeStateToInactive);

// Ruta para obtener los árboles del usuario actual
router.get("/trees/my-trees", getMyTrees);

// Ruta para renombrar un árbol
router.put("/trees/:id/rename", renameTree);

// Ruta para abandonar un árbol
router.delete("/trees/:id/abandon", abandonTree);

export default router;
