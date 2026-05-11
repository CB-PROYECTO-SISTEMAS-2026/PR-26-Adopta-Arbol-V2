import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";
import fs from "fs";
import path from "path";

export const uploadQrForUser = async (req, res) => {
  console.log("=== INICIO uploadQrForUser ===");
  console.log("Body:", req.body);
  console.log("File:", req.file);

  const { expirationDate, userId } = req.body; // Obtener userId del body
  const file = req.file;

  if (!file) {
    console.log("ERROR: No se recibió archivo");
    return res.status(400).json({ message: "Archivo no enviado" });
  }

  if (!userId) {
    console.log("ERROR: No se recibió userId");
    return res.status(400).json({ message: "ID de usuario requerido" });
  }

  // Carpeta para los QR (usando la estructura correcta)
  const qrFolder = path.join("public", "qrcodes");
  console.log("Carpeta QR:", qrFolder);
  if (!fs.existsSync(qrFolder)) {
    console.log("Creando carpeta QR:", qrFolder);
    fs.mkdirSync(qrFolder, { recursive: true });
  }

  // Obtener la extensión del archivo original
  const fileExtension = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = [".png", ".jpg", ".jpeg"];

  if (!allowedExtensions.includes(fileExtension)) {
    console.log("ERROR: Extensión no permitida:", fileExtension);
    return res
      .status(400)
      .json({ message: "Solo se permiten archivos PNG y JPG" });
  }

  // Determinar el nombre del archivo basado en la extensión
  const fileName =
    fileExtension === ".jpg" || fileExtension === ".jpeg" ? "1.jpg" : "1.png";
  const filePath = path.join(qrFolder, fileName);
  console.log("Archivo destino:", filePath);

  // Eliminar archivos anteriores (tanto .png como .jpg)
  const pngPath = path.join(qrFolder, "1.png");
  const jpgPath = path.join(qrFolder, "1.jpg");

  if (fs.existsSync(pngPath)) {
    console.log("Eliminando archivo anterior 1.png");
    fs.unlinkSync(pngPath);
  }

  if (fs.existsSync(jpgPath)) {
    console.log("Eliminando archivo anterior 1.jpg");
    fs.unlinkSync(jpgPath);
  }

  // Verificar que el archivo temporal existe
  if (!fs.existsSync(file.path)) {
    console.log("ERROR: Archivo temporal no existe:", file.path);
    return res.status(500).json({ message: "Archivo temporal no encontrado" });
  }

  // Mover el nuevo archivo
  console.log("Moviendo archivo de", file.path, "a", filePath);
  fs.renameSync(file.path, filePath);
  console.log("Archivo movido exitosamente");

  // URL fija basada en la extensión
  const qrUrl = `/qrcodes/${fileName}`;

  try {
    console.log(
      "Actualizando BD con userId:",
      userId,
      "expirationDate:",
      expirationDate,
      "qrUrl:",
      qrUrl,
    );

    // Verificar si ya existe un QR para este usuario
    const [existingQr] = await pool.query(
      "SELECT id FROM qrcode WHERE userId = ?",
      [userId],
    );

    if (existingQr.length > 0) {
      // Actualizar QR existente
      await pool.query(
        `UPDATE qrcode 
         SET url = ?, expirationDate = ?, status = 1, type = 'cobro'
         WHERE userId = ?`,
        [qrUrl, expirationDate, userId],
      );
      console.log("QR actualizado para usuario:", userId);
    } else {
      // Crear nuevo QR
      await pool.query(
        `INSERT INTO qrcode (url, expirationDate, userId, status, registerDate, type)
         VALUES (?, ?, ?, 1, NOW(), 'cobro')`,
        [qrUrl, expirationDate, userId],
      );
      console.log("Nuevo QR creado para usuario:", userId);
    }

    console.log("=== ÉXITO uploadQrForUser ===");
    res.json({ message: "✅ QR actualizado correctamente", qrUrl });
  } catch (error) {
    console.error("=== ERROR uploadQrForUser ===");
    console.error("Error completo:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error al guardar QR",
      error: error.message,
      stack: error.stack,
    });
  }
};

export const getPendingRedemptions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.amount, r.registerDate, r.lastUpdate, r.status, u.id as userId, u.name, u.lastName, u.email, q.id as qrCodeId, q.url as qrUrl, q.expirationDate
      FROM redemption r
      JOIN user u ON r.userId = u.id
      LEFT JOIN qrcode q ON r.qrCodeId = q.id
      ORDER BY r.registerDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener redemptions" });
  }
};

export const confirmRedemption = async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body; // ID del admin que confirma

  try {
    // Obtener información de la redención
    const [redemption] = await pool.query(
      `SELECT r.amount, r.userId 
       FROM redemption r 
       WHERE r.id = ?`,
      [id],
    );

    if (redemption.length === 0) {
      return res.status(404).json({ message: "Redención no encontrada" });
    }

    const { amount, userId } = redemption[0];

    // Descontar los créditos del usuario
    await pool.query(
      `UPDATE user 
       SET credits = credits - ? 
       WHERE id = ?`,
      [amount, userId],
    );

    // Actualizar la redención
    await pool.query(
      `UPDATE redemption 
       SET status = 1, 
           lastUpdate = CURRENT_TIMESTAMP,
           adminId = ?
       WHERE id = ?`,
      [adminId || 1, id],
    );

    // Crear notificación para el regador
    try {
      await createNotification(
        userId,
        "credits_purchased",
        "¡Pago de Créditos Confirmado!",
        `Tu solicitud de pago de ${amount} créditos ha sido confirmada. Los créditos han sido descontados de tu cuenta.`,
        id,
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }

    res.json({
      message: "Redemption confirmado",
      creditsDeducted: amount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al confirmar redemption" });
  }
};

export const rejectRedemption = async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body; // ID del admin que rechaza

  try {
    // Actualizar la redención
    await pool.query(
      `UPDATE redemption 
       SET status = 0, 
           lastUpdate = CURRENT_TIMESTAMP,
           adminId = ?
       WHERE id = ?`,
      [adminId || 1, id],
    );

    res.json({ message: "Redemption rechazado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al rechazar redemption" });
  }
};

export const getRedemptionDetails = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `
      SELECT r.id, r.amount, r.registerDate, r.status, r.adminId, r.lastUpdate, u.id as userId, u.name, u.lastName, u.email, q.url as qrUrl
      FROM redemption r
      JOIN user u ON r.userId = u.id
      LEFT JOIN qrcode q ON r.qrCodeId = q.id
      WHERE r.id = ?
    `,
      [id],
    );

    if (rows.length === 0)
      return res.status(404).json({ message: "Redemption no encontrado" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error al obtener detalles del redemption" });
  }
};

// Obtener QR del usuario
export const getUserQr = async (req, res) => {
  try {
    const { userId } = req.params;

    const [result] = await pool.query(
      "SELECT id, url, expirationDate, status FROM qrcode WHERE userId = ? AND status = 1 ORDER BY registerDate DESC LIMIT 1",
      [userId],
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontró QR para este usuario" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error al obtener QR del usuario:", error);
    res.status(500).json({ message: "Error al obtener QR del usuario" });
  }
};

// Obtener QR por ID específico
export const getQRCodeById = async (req, res) => {
  try {
    const { qrId } = req.params;

    const [result] = await pool.query(
      "SELECT id, url, expirationDate, status, userId, type FROM qrcode WHERE id = ?",
      [qrId],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "No se encontró QR con ese ID" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error al obtener QR por ID:", error);
    res.status(500).json({ message: "Error al obtener QR por ID" });
  }
};

// Obtener todos los códigos QR
export const getAllQRCodes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT qr.id, qr.url, qr.expirationDate, qr.status, qr.userId, qr.registerDate, qr.type, u.name as userName, u.lastName as userLastName FROM qrcode qr LEFT JOIN user u ON qr.userId = u.id ORDER BY qr.registerDate DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener todos los QR codes:", error);
    res.status(500).json({ message: "Error al obtener QR codes" });
  }
};

// Actualizar estado del código QR
export const updateQRCodeStatus = async (req, res) => {
  try {
    const { qrId } = req.params;
    const { status } = req.body;

    if (status === undefined || status === null) {
      return res.status(400).json({ message: "Estado requerido" });
    }

    // Verificar tipo del QR: si es 'retiro' no se permite cambiar su estado
    const [qrRows] = await pool.query("SELECT type FROM qrcode WHERE id = ?", [
      qrId,
    ]);

    if (qrRows.length === 0) {
      return res.status(404).json({ message: "QR code no encontrado" });
    }

    const qrType = (qrRows[0].type || "").toLowerCase();
    if (qrType === "retiro") {
      return res
        .status(403)
        .json({
          message:
            "No está permitido modificar el estado de QR de tipo 'retiro'",
        });
    }

    const [result] = await pool.query(
      "UPDATE qrcode SET status = ? WHERE id = ?",
      [status, qrId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "QR code no encontrado" });
    }

    res.json({
      message: "Estado del QR code actualizado exitosamente",
      id: qrId,
      status: status,
    });
  } catch (error) {
    console.error("Error al actualizar estado del QR code:", error);
    res.status(500).json({ message: "Error al actualizar QR code" });
  }
};

// Crear solicitud de redención
export const createRedemption = async (req, res) => {
  try {
    const { userId, qrCodeId, amount, adminId } = req.body;

    // Validar datos requeridos
    if (!userId || !qrCodeId || !amount) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }

    // Crear la solicitud de redención
    const [result] = await pool.query(
      "INSERT INTO redemption (userId, qrCodeId, amount, adminId, status) VALUES (?, ?, ?, ?, 2)",
      [userId, qrCodeId, amount, adminId || 1],
    );

    res.json({
      id: result.insertId,
      message: "Solicitud de redención creada exitosamente",
      status: 2, // Pendiente
    });
  } catch (error) {
    console.error("Error al crear redención:", error);
    res.status(500).json({ message: "Error al crear solicitud de redención" });
  }
};

// Subir comprobante de redención
export const uploadRedemptionProof = async (req, res) => {
  try {
    console.log("=== INICIO uploadRedemptionProof ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { redemptionId } = req.body;
    const file = req.file;

    if (!file) {
      console.log("ERROR: No se recibió archivo");
      return res.status(400).json({ message: "Archivo no enviado" });
    }

    if (!redemptionId) {
      console.log("ERROR: No se recibió redemptionId");
      return res.status(400).json({ message: "ID de redención requerido" });
    }

    console.log("Redemption ID:", redemptionId);
    console.log("Archivo original:", file.originalname);
    console.log("Archivo temporal:", file.path);

    // Verificar que la redención existe
    console.log("Verificando redención en BD...");
    const [redemption] = await pool.query(
      "SELECT id FROM redemption WHERE id = ?",
      [redemptionId],
    );

    if (redemption.length === 0) {
      console.log("ERROR: Redención no encontrada en BD");
      return res.status(404).json({ message: "Redención no encontrada" });
    }

    console.log("Redención encontrada:", redemption[0]);

    // Carpeta para los comprobantes
    const proofFolder = path.join("client", "public", "receipts");
    console.log("Carpeta destino:", proofFolder);

    if (!fs.existsSync(proofFolder)) {
      console.log("Creando carpeta:", proofFolder);
      fs.mkdirSync(proofFolder, { recursive: true });
    }

    // Generar nombre único para el archivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `redemption-${redemptionId}-${Date.now()}${fileExtension}`;
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

    // Almacenar la relación redención-comprobante en un archivo JSON temporal
    const evidenceData = {
      redemptionId: redemptionId,
      fileUrl: fileUrl,
      fileName: fileName,
      uploadDate: new Date().toISOString(),
    };

    // Leer archivo existente o crear uno nuevo
    const evidenceFile = path.join(
      "server",
      "data",
      "redemption-evidence.json",
    );
    const evidenceDir = path.dirname(evidenceFile);

    if (!fs.existsSync(evidenceDir)) {
      fs.mkdirSync(evidenceDir, { recursive: true });
    }

    let evidenceList = [];
    if (fs.existsSync(evidenceFile)) {
      try {
        const data = fs.readFileSync(evidenceFile, "utf8");
        evidenceList = JSON.parse(data);
      } catch (error) {
        console.log(
          "Error al leer archivo de evidencia, creando nuevo:",
          error.message,
        );
        evidenceList = [];
      }
    }

    // Agregar nueva evidencia
    evidenceList.push(evidenceData);

    // Guardar archivo actualizado
    fs.writeFileSync(evidenceFile, JSON.stringify(evidenceList, null, 2));
    console.log("Evidencia guardada en archivo JSON");

    console.log("=== ÉXITO uploadRedemptionProof ===");
    res.json({
      message: "Comprobante subido exitosamente",
      fileUrl: fileUrl,
      redemptionId: redemptionId,
    });
  } catch (error) {
    console.error("=== ERROR uploadRedemptionProof ===");
    console.error("Error completo:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error al subir comprobante",
      error: error.message,
      stack: error.stack,
    });
  }
};

// Confirmar solicitud de redención
export const confirmRedemptionRequest = async (req, res) => {
  try {
    const { redemptionId } = req.params;

    if (!redemptionId) {
      return res.status(400).json({ message: "ID de redención requerido" });
    }

    // Verificar que la redención existe
    const [redemption] = await pool.query(
      "SELECT id, status FROM redemption WHERE id = ?",
      [redemptionId],
    );

    if (redemption.length === 0) {
      return res.status(404).json({ message: "Redención no encontrada" });
    }

    // Verificar si existe comprobante en el archivo JSON
    const evidenceFile = path.join(
      "server",
      "data",
      "redemption-evidence.json",
    );
    let hasEvidence = false;

    if (fs.existsSync(evidenceFile)) {
      try {
        const data = fs.readFileSync(evidenceFile, "utf8");
        const evidenceList = JSON.parse(data);
        hasEvidence = evidenceList.some(
          (evidence) => evidence.redemptionId == redemptionId,
        );
      } catch (error) {
        console.log("Error al leer archivo de evidencia:", error.message);
      }
    }

    if (!hasEvidence) {
      return res
        .status(400)
        .json({ message: "Debe adjuntar un comprobante antes de confirmar" });
    }

    // Actualizar el status a confirmado (status = 1)
    await pool.query(
      "UPDATE redemption SET status = 1, lastUpdate = NOW() WHERE id = ?",
      [redemptionId],
    );

    res.json({
      message: "Solicitud confirmada exitosamente",
      status: 1,
    });
  } catch (error) {
    console.error("Error al confirmar redención:", error);
    res.status(500).json({ message: "Error al confirmar la solicitud" });
  }
};

// Crear redención del regador con QR
export const createIrrigatorRedemption = async (req, res) => {
  let connection = null;
  let movedQrFilePath = null;

  try {
    console.log("=== INICIO createIrrigatorRedemption ===");
    console.log("Body:", req.body);
    console.log("File:", req.file);

    const { userId, amount } = req.body;
    const file = req.file;

    // Validaciones
    if (!userId || !amount || !file) {
      return res
        .status(400)
        .json({ message: "Faltan datos requeridos (userId, amount, qrFile)" });
    }

    // Asegurar que existe la carpeta temporal
    const tmpFolder = path.join("server", "tmp");
    if (!fs.existsSync(tmpFolder)) {
      console.log("Creando carpeta tmp...");
      fs.mkdirSync(tmpFolder, { recursive: true });
    }

    // Carpeta para los QR
    const qrFolder = path.join("client", "public", "qrcodes");
    if (!fs.existsSync(qrFolder)) {
      console.log("Creando carpeta qrcodes...");
      fs.mkdirSync(qrFolder, { recursive: true });
    }

    // Obtener extensión del archivo
    const fileExtension = path.extname(file.originalname).toLowerCase();
    const fileName = `retiro-${userId}-${Date.now()}${fileExtension}`;
    movedQrFilePath = path.join(qrFolder, fileName);

    console.log("Guardando archivo como:", fileName);

    // Mover el archivo
    fs.renameSync(file.path, movedQrFilePath);

    // URL del QR
    const qrUrl = `/qrcodes/${fileName}`;

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insertar en qrcode
    const [qrResult] = await connection.query(
      "INSERT INTO qrcode (url, expirationDate, userId, type) VALUES (?, NULL, ?, 'retiro')",
      [qrUrl, userId],
    );

    const qrCodeId = qrResult.insertId;
    console.log("QR Code creado con ID:", qrCodeId);

    // Insertar en redemption
    const [redemptionResult] = await connection.query(
      "INSERT INTO redemption (amount, userId, qrCodeId) VALUES (?, ?, ?)",
      [amount, userId, qrCodeId],
    );

    const redemptionId = redemptionResult.insertId;
    console.log("Redemption creada con ID:", redemptionId);

    await connection.commit();

    console.log("=== ÉXITO createIrrigatorRedemption ===");
    res.json({
      message: "Solicitud de redención creada exitosamente",
      redemptionId: redemptionId,
      qrCodeId: qrCodeId,
      qrUrl: qrUrl,
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al hacer rollback:", rollbackError);
      }
    }

    if (movedQrFilePath && fs.existsSync(movedQrFilePath)) {
      try {
        fs.unlinkSync(movedQrFilePath);
      } catch (fileError) {
        console.error("Error al limpiar archivo QR tras fallo:", fileError);
      }
    }

    console.error("=== ERROR createIrrigatorRedemption ===");
    console.error("Error completo:", error);
    res.status(500).json({
      message: "Error al crear solicitud de redención",
      error: error.message,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};
