import { Router } from "express";
import {
  getIrrigations,
  getIrrigation,
  approveIrrigation,
  rejectIrrigation,
  createIrrigation,
  getPendingIrrigations,
  getAssignedIrrigation,
  assignTreeToIrrigator,
  confirmIrrigation,
  getTreeIrrigationEvidence,
  upload,
} from "../controllers/irrigation.controller.js";

const router = Router();

// Crear solicitud de riego
router.post("/irrigations", createIrrigation);

// Obtener todos los riegos pendientes
router.get("/irrigations", getIrrigations);

// Obtener irrigation pendientes (status = 4) para regadores
router.get("/irrigations/pending/map", getPendingIrrigations);

// Obtener irrigation asignado al regador (status = 3)
router.get("/irrigations/assigned/:irrigatorId", getAssignedIrrigation);

// Obtener evidencia de riego de un árbol específico
router.get("/irrigations/tree/:treeId", getTreeIrrigationEvidence);

// Asignar irrigation a regador
router.post("/irrigations/assign", assignTreeToIrrigator);

// Obtener un riego específico
router.get("/irrigations/:id", getIrrigation);

// Confirmar riego con evidencia (regador) - cambiar status a 2
router.put(
  "/irrigations/:id/confirm",
  upload.single("evidence"),
  confirmIrrigation,
);

// Aprobar riego (cambiar estado a 1)
router.put("/irrigations/:id/approve", approveIrrigation);

// Rechazar riego (cambiar estado a 0)
router.put("/irrigations/:id/reject", rejectIrrigation);

export default router;
