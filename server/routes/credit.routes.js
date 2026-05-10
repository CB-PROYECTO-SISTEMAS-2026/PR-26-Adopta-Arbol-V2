import { Router } from "express";
import {
  getAllPurchases,
  getPendingPurchases,
  approvePurchase,
  rejectPurchase,
  getPurchaseDetails,
  getAllCreditOptionsAdmin,
  getAllCreditOptions,
  getTopCreditOptions,
  getCreditOptionById,
  createCreditOption,
  updateCreditOption,
  deleteCreditOption,
} from "../controllers/credit.controller.js";

const router = Router();

// ========================================
// Rutas para gestión de OPCIONES DE CRÉDITO
// ========================================

// Obtener todas las opciones de crédito (admin)
router.get("/credit-options/admin", getAllCreditOptionsAdmin);

// Obtener las 5 opciones de crédito más compradas
router.get("/credit-options/stats/top", getTopCreditOptions);

// Obtener todas las opciones de crédito activas
router.get("/credit-options", getAllCreditOptions);

// Obtener opción de crédito específica
router.get("/credit-options/:id", getCreditOptionById);

// Crear opción de crédito (Admin)
router.post("/credit-options", createCreditOption);

// Actualizar opción de crédito (Admin)
router.put("/credit-options/:id", updateCreditOption);

// Eliminar (delete lógico) opción de crédito (Admin)
router.delete("/credit-options/:id", deleteCreditOption);

// ========================================
// Rutas para gestión de COMPRAS
// ========================================

// Obtener todas las compras
router.get("/purchases", getAllPurchases);

// Obtener compras pendientes
router.get("/purchases/pending", getPendingPurchases);

// Aprobar compra
router.put("/purchases/approve/:id", approvePurchase);

// Rechazar compra
router.put("/purchases/reject/:id", rejectPurchase);

// Obtener detalles de una compra
router.get("/purchases/details/:id", getPurchaseDetails);

export default router;
