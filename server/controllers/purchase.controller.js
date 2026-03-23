import { pool } from "../db.js";
import fs from "fs";
import path from "path";

// Crear solicitud de compra
export const createPurchase = async (req, res) => {
  try {
    const { userId, qrcodeId, creditId } = req.body;

    // Validar datos requeridos
    if (!userId || !qrcodeId || !creditId) {
      return res.status(400).json({
        message: "Faltan datos requeridos: userId, qrcodeId, creditId",
      });
    }

    // Crear la solicitud de compra - adminId será NULL inicialmente
    const [result] = await pool.query(
      "INSERT INTO purchase (userId, qrcodeId, creditId, adminId, status) VALUES (?, ?, ?, NULL, 2)",
      [userId, qrcodeId, creditId],
    );

    res.json({
      id: result.insertId,
      message: "Solicitud de compra creada exitosamente",
      status: 2, // Pendiente
    });
  } catch (error) {
    console.error("Error al crear compra:", error);
    res.status(500).json({ message: "Error al crear solicitud de compra" });
  }
};

// Subir comprobante de compra
export const uploadPurchaseProof = async (req, res) => {
  try {
    console.log("=== INICIO uploadPurchaseProof ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { purchaseId } = req.body;
    const file = req.file;

    if (!file) {
      console.log("ERROR: No se recibió archivo");
      return res.status(400).json({ message: "Archivo no enviado" });
    }

    if (!purchaseId) {
      console.log("ERROR: No se recibió purchaseId");
      return res.status(400).json({ message: "ID de compra requerido" });
    }

    console.log("Purchase ID:", purchaseId);
    console.log("Archivo original:", file.originalname);
    console.log("Archivo temporal:", file.path);

    // Verificar que la compra existe
    console.log("Verificando compra en BD...");
    const [purchase] = await pool.query(
      "SELECT id FROM purchase WHERE id = ?",
      [purchaseId],
    );

    if (purchase.length === 0) {
      console.log("ERROR: Compra no encontrada en BD");
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    console.log("Compra encontrada:", purchase[0]);

    // Carpeta para los comprobantes
    const proofFolder = path.join("client", "public", "receipts");
    console.log("Carpeta destino:", proofFolder);

    if (!fs.existsSync(proofFolder)) {
      console.log("Creando carpeta:", proofFolder);
      fs.mkdirSync(proofFolder, { recursive: true });
    }

    // Generar nombre del archivo usando solo el ID de la compra
    const fileExtension = path.extname(file.originalname);
    const fileName = `${purchaseId}${fileExtension}`;
    const filePath = path.join(proofFolder, fileName);

    console.log("Archivo destino:", filePath);

    // Verificar que el archivo temporal existe
    if (!fs.existsSync(file.path)) {
      console.log("ERROR: Archivo temporal no existe:", file.path);
      return res
        .status(500)
        .json({ message: "Archivo temporal no encontrado" });
    }

    // Mover el archivo
    console.log("Moviendo archivo...");
    fs.renameSync(file.path, filePath);
    console.log("Archivo movido exitosamente");

    // URL del archivo
    const fileUrl = `/receipts/${fileName}`;
    console.log("URL del archivo:", fileUrl);

    // Actualizar la compra con la ruta del comprobante en la columna receipt
    console.log("Actualizando BD con comprobante...");
    await pool.query(
      "UPDATE purchase SET receipt = ?, lastUpdate = NOW() WHERE id = ?",
      [fileUrl, purchaseId],
    );
    console.log("BD actualizada con comprobante");

    console.log("=== ÉXITO uploadPurchaseProof ===");
    res.json({
      message: "Comprobante subido exitosamente",
      fileUrl: fileUrl,
      purchaseId: purchaseId,
    });
  } catch (error) {
    console.error("=== ERROR uploadPurchaseProof ===");
    console.error("Error completo:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error al subir comprobante",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Confirmar solicitud de compra
export const confirmPurchaseRequest = async (req, res) => {
  try {
    const { purchaseId } = req.params;

    if (!purchaseId) {
      return res.status(400).json({ message: "ID de compra requerido" });
    }

    // Verificar que la compra existe y tiene comprobante
    const [purchase] = await pool.query(
      "SELECT id, status, receipt FROM purchase WHERE id = ?",
      [purchaseId],
    );

    if (purchase.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    if (!purchase[0].receipt) {
      return res
        .status(400)
        .json({ message: "Debe adjuntar un comprobante antes de confirmar" });
    }

    // Mantener el status 2 (pendiente) - solo actualizar lastUpdate
    await pool.query("UPDATE purchase SET lastUpdate = NOW() WHERE id = ?", [
      purchaseId,
    ]);

    res.json({
      message: "Solicitud confirmada exitosamente",
      status: 2,
    });
  } catch (error) {
    console.error("Error al confirmar compra:", error);
    res.status(500).json({ message: "Error al confirmar la solicitud" });
  }
};
