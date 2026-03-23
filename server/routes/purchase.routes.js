import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import {
  createPurchase,
  uploadPurchaseProof,
  confirmPurchaseRequest,
} from "../controllers/purchase.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// Crear carpeta temporal si no existe
const tmpDir = path.join(__dirname, "..", "tmp");
if (!fs.existsSync(tmpDir)) {
  fs.mkdirSync(tmpDir, { recursive: true });
}

// Configuración de multer para subir comprobantes
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tmpDir); // Usar ruta absoluta
  },
  filename: (req, file, cb) => {
    // Generar nombre único para el archivo temporal
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "proof-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadProof = multer({
  storage: proofStorage,
  fileFilter: (req, file, cb) => {
    console.log("File Filter - mimetype:", file.mimetype);
    // Aceptar solo archivos de imagen
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos de imagen"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
  },
});

// Middleware para manejar errores de multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "FILE_TOO_LARGE") {
      return res
        .status(400)
        .json({ message: "Archivo demasiado grande. Máximo 5MB" });
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ message: "Archivo demasiado grande. Máximo 5MB" });
    }
    return res
      .status(400)
      .json({ message: `Error en la carga: ${err.message}` });
  } else if (err) {
    return res.status(400).json({
      message: err.message || "Error desconocido al procesar la carga",
    });
  }
  next();
};

// Middleware de validación para POST purchase
const validatePurchaseData = (req, res, next) => {
  const { userId, qrcodeId, creditId } = req.body;
  if (!userId || !qrcodeId || !creditId) {
    return res.status(400).json({
      message: "Datos incompletos: userId, qrcodeId y creditId son requeridos",
    });
  }
  next();
};

// Middleware de validación para POST purchase-proof
const validateProofData = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "Archivo requerido" });
  }
  if (!req.body.purchaseId) {
    return res.status(400).json({ message: "ID de compra requerido" });
  }
  next();
};

// -----------------------------
// Rutas
// -----------------------------

// Crear solicitud de compra
router.post("/purchase", validatePurchaseData, createPurchase);

// Subir comprobante de compra
router.post(
  "/purchase-proof",
  uploadProof.single("proofFile"),
  handleMulterError,
  validateProofData,
  uploadPurchaseProof,
);

// Confirmar solicitud de compra
router.put("/purchase/:purchaseId/confirm", confirmPurchaseRequest);

export default router;
