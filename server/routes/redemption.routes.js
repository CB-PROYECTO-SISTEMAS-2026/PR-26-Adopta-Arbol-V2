import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  uploadQrForUser,
  getPendingRedemptions,
  confirmRedemption,
  rejectRedemption,
  getRedemptionDetails,
  getUserQr,
  getQRCodeById,
  createRedemption,
  uploadRedemptionProof,
  confirmRedemptionRequest,
  createIrrigatorRedemption
} from "../controllers/redemption.controller.js";

const router = Router();

// Función para asegurar que existe la carpeta tmp
const ensureTmpFolder = () => {
  const tmpFolder = path.join("server", "tmp");
  if (!fs.existsSync(tmpFolder)) {
    fs.mkdirSync(tmpFolder, { recursive: true });
    console.log("Carpeta tmp creada:", tmpFolder);
  }
};

// Configuración de multer para subir QR
const qrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureTmpFolder(); // Asegurar que la carpeta existe
    cb(null, "server/tmp/"); // Carpeta temporal antes de moverlo a public/qrcodes
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Nombre temporal, luego se renombra
  }
});

// Configuración de multer para subir comprobantes
const proofStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureTmpFolder(); // Asegurar que la carpeta existe
    cb(null, "server/tmp/"); // Carpeta temporal
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // Nombre temporal
  }
});

const uploadQR = multer({ 
  storage: qrStorage,
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

// Subir QR
router.post("/upload-qr", (req, res, next) => {
  console.log("=== INICIO RUTA UPLOAD-QR ===");
  console.log("Headers:", req.headers);
  console.log("Body antes de multer:", req.body);
  
  uploadQR.single("qrFile")(req, res, (err) => {
    console.log("=== DESPUÉS DE MULTER ===");
    console.log("Error:", err);
    console.log("File:", req.file);
    console.log("Body después de multer:", req.body);
    
    if (err) {
      console.error("Error de multer:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 5MB" });
      }
      if (err.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({ message: "Solo se permiten archivos de imagen (JPG, PNG, GIF)" });
      }
      return res.status(400).json({ message: "Error al procesar el archivo", error: err.message });
    }
    
    if (!req.file) {
      console.log("ERROR: No se recibió archivo en multer");
      return res.status(400).json({ message: "No se recibió archivo" });
    }
    
    next();
  });
}, uploadQrForUser);

// Obtener todas las redemptions pendientes
router.get("/pending", getPendingRedemptions);

// Confirmar redemption
router.put("/confirm/:id", confirmRedemption);

// Rechazar redemption
router.put("/reject/:id", rejectRedemption);

// Obtener detalles de un redemption
router.get("/details/:id", getRedemptionDetails);

// Obtener QR del usuario
router.get("/qrcode/:userId", getUserQr);

// Obtener QR por ID específico
router.get("/qrcode-by-id/:qrId", getQRCodeById);

// Crear solicitud de redención
router.post("/redemption", createRedemption);

// Subir comprobante de redención
router.post("/redemption-proof", (req, res, next) => {
  uploadProof.single("proofFile")(req, res, (err) => {
    if (err) {
      console.error("Error de multer:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "El archivo es demasiado grande. Máximo 5MB" });
      }
      if (err.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({ message: "Solo se permiten archivos de imagen (JPG, PNG, GIF)" });
      }
      return res.status(400).json({ message: "Error al procesar el archivo", error: err.message });
    }
    next();
  });
}, uploadRedemptionProof);

// Confirmar solicitud de redención
router.put("/redemption/:redemptionId/confirm", confirmRedemptionRequest);

// Crear redención del regador con QR
router.post("/irrigator-redemption", uploadQR.single("qrFile"), createIrrigatorRedemption);

export default router;
