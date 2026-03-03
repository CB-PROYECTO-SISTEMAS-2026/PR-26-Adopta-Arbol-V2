import { Router } from "express";
import {
  getAllPurchases,
  getPendingPurchases,
  approvePurchase,
  rejectPurchase,
  getPurchaseDetails
} from "../controllers/credit.controller.js";

const router = Router();

// -----------------------------
// Rutas para gestión de compras
// -----------------------------

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
