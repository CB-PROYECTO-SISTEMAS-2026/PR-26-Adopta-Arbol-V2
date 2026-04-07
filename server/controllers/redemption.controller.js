import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";
import fs from "fs";
import path from "path";

const QR_FOLDER = path.join("public", "qrcodes");

const ensureQrFolderExists = () => {
  if (!fs.existsSync(QR_FOLDER)) {
    fs.mkdirSync(QR_FOLDER, { recursive: true });
  }
};

const normalizeQrExtension = (extension) => {
  const normalized = String(extension || "").toLowerCase();
  return normalized === ".jpeg" ? ".jpg" : normalized;
};

const getQrImageFileMap = () => {
  const map = new Map();

  if (!fs.existsSync(QR_FOLDER)) {
    return map;
  }

  const files = fs.readdirSync(QR_FOLDER, { withFileTypes: true });
  for (const fileEntry of files) {
    if (!fileEntry.isFile()) {
      continue;
    }

    const parsed = path.parse(fileEntry.name);
    const extension = parsed.ext.toLowerCase();
    if (!extension) {
      continue;
    }

    if (!/^\d+$/.test(parsed.name)) {
      continue;
    }

    const qrId = Number(parsed.name);
    const filePath = path.join(QR_FOLDER, fileEntry.name);
    let mtimeMs = 0;

    try {
      mtimeMs = fs.statSync(filePath).mtimeMs;
    } catch {
      continue;
    }

    const current = map.get(qrId);
    if (!current || mtimeMs >= current.mtimeMs) {
      map.set(qrId, { fileName: fileEntry.name, mtimeMs });
    }
  }

  return map;
};

const deleteQrFilesForId = (qrId) => {
  if (!fs.existsSync(QR_FOLDER)) {
    return;
  }

  const idPrefix = `${qrId}.`;
  const files = fs.readdirSync(QR_FOLDER, { withFileTypes: true });

  for (const fileEntry of files) {
    if (!fileEntry.isFile()) {
      continue;
    }

    if (!fileEntry.name.startsWith(idPrefix)) {
      continue;
    }

    const extension = path.extname(fileEntry.name).toLowerCase();
    if (!extension) {
      continue;
    }

    const filePath = path.join(QR_FOLDER, fileEntry.name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

const resolveQrUrlForRow = (qrRow, fileMap = null) => {
  const map = fileMap || getQrImageFileMap();
  const mapEntry = map.get(Number(qrRow?.id));

  if (mapEntry?.fileName) {
    return `/qrcodes/${mapEntry.fileName}`;
  }

  if (qrRow?.url) {
    const dbFileName = path.basename(qrRow.url);
    const dbFilePath = path.join(QR_FOLDER, dbFileName);
    if (dbFileName && fs.existsSync(dbFilePath)) {
      return `/qrcodes/${dbFileName}`;
    }
  }

  return null;
};

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

  ensureQrFolderExists();
  console.log("Carpeta QR:", QR_FOLDER);

  // Obtener la extensión del archivo original
  const fileExtension = normalizeQrExtension(path.extname(file.originalname));
  const isImageMimeType = String(file.mimetype || "").startsWith("image/");

  if (!isImageMimeType || !fileExtension) {
    console.log("ERROR: Archivo no válido para QR", {
      mimetype: file.mimetype,
      extension: fileExtension,
    });
    return res
      .status(400)
      .json({ message: "Solo se permiten archivos de imagen" });
  }

  // Verificar que el archivo temporal existe
  if (!fs.existsSync(file.path)) {
    console.log("ERROR: Archivo temporal no existe:", file.path);
    return res.status(500).json({ message: "Archivo temporal no encontrado" });
  }

  let connection = null;
  let movedFilePath = null;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log(
      "Actualizando BD con userId:",
      userId,
      "expirationDate:",
      expirationDate,
    );

    // Buscar un QR de cobro existente para este usuario.
    const [existingQr] = await connection.query(
      "SELECT id FROM qrcode WHERE userId = ? AND type = 'cobro' ORDER BY id ASC LIMIT 1",
      [userId],
    );

    let qrId;
    if (existingQr.length > 0) {
      qrId = existingQr[0].id;
      console.log("QR existente encontrado para usuario:", userId, "id:", qrId);
    } else {
      const [insertResult] = await connection.query(
        `INSERT INTO qrcode (url, expirationDate, userId, status, registerDate, type)
         VALUES ('', ?, ?, 1, NOW(), 'cobro')`,
        [expirationDate || null, userId],
      );
      qrId = insertResult.insertId;
      console.log("Nuevo QR creado para usuario:", userId, "id:", qrId);
    }

    const fileName = `${qrId}${fileExtension}`;
    const targetFilePath = path.join(QR_FOLDER, fileName);
    const qrUrl = `/qrcodes/${fileName}`;

    // Mantener solo una imagen por id QR (sin depender de extensión previa).
    deleteQrFilesForId(qrId);

    console.log("Moviendo archivo de", file.path, "a", targetFilePath);
    fs.renameSync(file.path, targetFilePath);
    movedFilePath = targetFilePath;
    console.log("Archivo movido exitosamente");

    await connection.query(
      `UPDATE qrcode 
       SET url = ?, expirationDate = ?, status = 1, type = 'cobro', registerDate = NOW()
       WHERE id = ?`,
      [qrUrl, expirationDate || null, qrId],
    );

    await connection.commit();

    console.log("=== ÉXITO uploadQrForUser ===");
    res.json({ message: "✅ QR actualizado correctamente", qrUrl, qrId });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error(
          "Error al hacer rollback uploadQrForUser:",
          rollbackError,
        );
      }
    }

    if (movedFilePath && fs.existsSync(movedFilePath)) {
      try {
        fs.unlinkSync(movedFilePath);
      } catch (cleanupError) {
        console.error(
          "Error limpiando archivo movido tras fallo:",
          cleanupError,
        );
      }
    }

    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (tempCleanupError) {
        console.error(
          "Error limpiando archivo temporal tras fallo:",
          tempCleanupError,
        );
      }
    }

    console.error("=== ERROR uploadQrForUser ===");
    console.error("Error completo:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({
      message: "Error al guardar QR",
      error: error.message,
      stack: error.stack,
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

export const getPendingRedemptions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT r.id, r.amount, r.registerDate, r.status, u.id as userId, u.name, u.lastName, u.email, q.id as qrCodeId, q.url as qrUrl, q.expirationDate
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

// Obtener el primer QR activo de tipo cobro (status = 1)
export const getFirstActiveQRCode = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT id, url, expirationDate, status, userId, type FROM qrcode WHERE status = 1 AND type = 'cobro' ORDER BY id ASC LIMIT 1",
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "No hay QR activo de cobro disponible" });
    }

    const qrRow = result[0];
    const resolvedUrl = resolveQrUrlForRow(qrRow);

    if (!resolvedUrl) {
      return res.status(404).json({
        message:
          "Hay un QR activo de cobro en base de datos, pero no se encontro su imagen",
      });
    }

    if (resolvedUrl !== qrRow.url) {
      try {
        await pool.query("UPDATE qrcode SET url = ? WHERE id = ?", [
          resolvedUrl,
          qrRow.id,
        ]);
      } catch (syncError) {
        console.error("No se pudo sincronizar URL de QR:", syncError.message);
      }
    }

    res.json({ ...qrRow, url: resolvedUrl });
  } catch (error) {
    console.error("Error al obtener el primer QR activo:", error);
    res.status(500).json({ message: "Error al obtener QR activo" });
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

    const qrRow = result[0];
    const resolvedUrl = resolveQrUrlForRow(qrRow);
    res.json({ ...qrRow, url: resolvedUrl || qrRow.url });
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
    const fileMap = getQrImageFileMap();
    const normalizedRows = rows.map((row) => {
      const resolvedUrl = resolveQrUrlForRow(row, fileMap);
      return { ...row, url: resolvedUrl || row.url };
    });

    res.json(normalizedRows);
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
      return res.status(403).json({
        message: "No está permitido modificar el estado de QR de tipo 'retiro'",
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
