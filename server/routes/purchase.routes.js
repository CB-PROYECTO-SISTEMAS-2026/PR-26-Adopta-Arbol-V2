import { Router } from "express";
import multer from "multer";
import path from "path";
import {
  createPurchase,
  uploadPurchaseProof,
  confirmPurchaseRequest
} from "../controllers/purchase.controller.js";

const router = Router();

// Configuración de multer para subir comprobantes
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "server/tmp/"); // Carpeta temporal
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Nombre temporal
  }
});

const uploadProof = multer({ 
  storage: proofStorage,
  fileFilter: (req, file, cb) => {
    // Aceptar solo archivos de imagen
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB máximo
  }
});

// -----------------------------
// Rutas
// -----------------------------

// Crear solicitud de compra
router.post("/purchase", createPurchase);

// Subir comprobante de compra
router.post("/purchase-proof", uploadProof.single("proofFile"), uploadPurchaseProof);

// Confirmar solicitud de compra
router.put("/purchase/:purchaseId/confirm", confirmPurchaseRequest);

export default router;
