import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de multer para subir evidencia de riego
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ruta absoluta: PSI-Adopta-Arbol/client/public/evidence
    const dir = path.join(__dirname, "../../client/public/evidence");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Usar el ID del riego que viene en el req.body
    const irrigationId = req.body.irrigationId || req.params.id;
    const ext = path.extname(file.originalname);
    cb(null, `${irrigationId}${ext}`);
  },
});

export const upload = multer({ storage });

// Crear solicitud de riego
export const createIrrigation = async (req, res) => {
  const { userId, treeId } = req.body;

  if (!userId || !treeId) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  try {
    // Verificar que el usuario sea dueño del árbol y obtener el precio
    const [ownershipCheck] = await pool.query(
      `
      SELECT a.id, t.price FROM adoption a 
      JOIN tree t ON a.treeId = t.id
      WHERE a.userId = ? AND a.treeId = ? AND a.status = 1
    `,
      [userId, treeId],
    );

    if (ownershipCheck.length === 0) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para regar este árbol" });
    }

    // Insertar riego con status = 4
    const [result] = await pool.query(`
      INSERT INTO irrigation (userId, treeId, status)
      VALUES (?, ?, 4)
    `, [userId, treeId]);

    res.status(201).json({
      message: "Riego registrado exitosamente",
      irrigationId: result.insertId
    });
  } catch (error) {
    console.error("Error al crear riego:", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los riegos con estado 2 (pendientes)
export const getIrrigations = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        irrigation.id, 
        irrigation.registerDate, 
        irrigation.status,
        user.name AS userName, 
        user.lastName AS userLastName,
        tree.name AS treeName,
        tree.code AS treeCode
      FROM irrigation
      INNER JOIN user ON irrigation.userId = user.id
      INNER JOIN tree ON irrigation.treeId = tree.id
      WHERE irrigation.status = 2
      ORDER BY irrigation.registerDate DESC
    `);
    res.json(result);
  } catch (error) {
    console.error("Error al obtener los riegos:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Aprobar riego - cambiar estado a 1 (aprobado)
export const approveIrrigation = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener datos del riego
    const [irrigationData] = await connection.query(`
      SELECT i.userId, t.name as treeName 
      FROM irrigation i
      JOIN tree t ON i.treeId = t.id
      WHERE i.id = ? AND i.status = 2
    `,
      [id],
    );

    if (irrigationData.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Riego no encontrado o ya procesado" });
    }

    const { userId, treeName } = irrigationData[0];

    // Actualizar estado del riego
    const [result] = await connection.query(
      "UPDATE irrigation SET status = 1 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Riego no encontrado" });
    }

    // Note: Reward system would require additional database columns

    await connection.commit();

    // Crear notificación para el usuario
    try {
      await createNotification(
        userId,
        "tree_irrigated",
        "¡Riego Aprobado!",
        `Tu riego del árbol "${treeName}" ha sido aprobado.`,
        id
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }

    res.json({ message: "Riego aprobado exitosamente y puntos agregados" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al aprobar riego:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// Rechazar riego - cambiar estado a 0 (rechazado)
export const rejectIrrigation = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE irrigation SET status = 0 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Riego no encontrado" });
    }

    res.json({ message: "Riego rechazado exitosamente" });
  } catch (error) {
    console.error("Error al rechazar riego:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener un riego específico por ID
export const getIrrigation = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `
      SELECT 
        irrigation.id, 
        irrigation.registerDate, 
        irrigation.status,
        user.name AS userName, 
        user.lastName AS userLastName,
        user.email AS userEmail,
        tree.name AS treeName,
        tree.code AS treeCode,
        tree.address AS treeAddress
      FROM irrigation
      INNER JOIN user ON irrigation.userId = user.id
      INNER JOIN tree ON irrigation.treeId = tree.id
      WHERE irrigation.id = ?
    `,
      [id],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Riego no encontrado" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error al obtener riego:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener irrigation pendientes (status = 4) con ubicación del árbol
export const getPendingIrrigations = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        irrigation.id AS irrigationId,
        irrigation.treeId,
        irrigation.registerDate,
        tree.name AS treeName,
        tree.latitude,
        tree.longitude,
        tree.address AS treeAddress,
        tree.code AS treeCode,
        tree.price,
        tree.description
      FROM irrigation
      INNER JOIN tree ON irrigation.treeId = tree.id
      WHERE irrigation.status = 4
      ORDER BY irrigation.registerDate ASC
    `);
    res.json(result || []);
  } catch (error) {
    console.error("Error al obtener irrigation pendientes:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener irrigation asignado al regador (status = 3)
export const getAssignedIrrigation = async (req, res) => {
  const { irrigatorId } = req.params;

  try {
    if (!irrigatorId) {
      return res.status(400).json({ message: "irrigatorId es requerido" });
    }

    const [result] = await pool.query(
      `
      SELECT 
        irrigation.id AS irrigationId,
        irrigation.treeId,
        irrigation.registerDate,
        tree.name AS treeName,
        tree.latitude,
        tree.longitude,
        tree.address AS treeAddress,
        tree.code AS treeCode,
        tree.price,
        tree.description
      FROM irrigation
      INNER JOIN tree ON irrigation.treeId = tree.id
      WHERE irrigation.userId = ? AND irrigation.status = 3
      ORDER BY irrigation.registerDate ASC
    `,
      [irrigatorId],
    );
    res.json(result || []);
  } catch (error) {
    console.error("Error al obtener irrigation asignado:", error);
    res.status(500).json({ message: error.message, details: error.code });
  }
};

// Asignar irrigation a regador (cambiar status de irrigation de 4 a 3)
export const assignTreeToIrrigator = async (req, res) => {
  const { irrigationId, irrigatorId } = req.body;

  if (!irrigationId || !irrigatorId) {
    return res.status(400).json({ message: "Faltan datos requeridos" });
  }

  try {
    // Verificar que el irrigation esté disponible (status = 4)
    const [irrigationCheck] = await pool.query(
      "SELECT id, treeId FROM irrigation WHERE id = ? AND status = 4",
      [irrigationId]
    );

    if (irrigationCheck.length === 0) {
      return res
        .status(400)
        .json({ message: "El riego no está disponible para asignación" });
    }

    // Verificar que el regador no tenga ya un riego asignado
    const [existingAssignment] = await pool.query(
      "SELECT id FROM irrigation WHERE userId = ? AND status = 3",
      [irrigatorId],
    );

    if (existingAssignment.length > 0) {
      return res.status(400).json({ message: "Ya tienes un riego asignado" });
    }

    // Iniciar transacción
    await pool.query("START TRANSACTION");

    try {
      // Cambiar status del irrigation a 3 (asignado al regador)
      await pool.query(
        "UPDATE irrigation SET userId = ?, status = 3, lastUpdate = NOW() WHERE id = ?",
        [irrigatorId, irrigationId],
      );

      await pool.query("COMMIT");

      res.json({
        message: "Riego asignado exitosamente",
        irrigationId: irrigationId,
        treeId: irrigationCheck[0].treeId
      });
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error al asignar riego:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Confirmar riego con evidencia (regador)
export const confirmIrrigation = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Verificar que el riego existe y está en status 3
    const [irrigationData] = await pool.query(
      "SELECT id, status FROM irrigation WHERE id = ?",
      [id],
    );

    if (irrigationData.length === 0) {
      return res.status(404).json({ message: "Riego no encontrado" });
    }

    if (irrigationData[0].status !== 3) {
      return res
        .status(400)
        .json({ message: "El riego no está disponible para confirmar" });
    }

    // Actualizar el riego con status = 2
    const [result] = await pool.query(
      "UPDATE irrigation SET status = 2 WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Error al actualizar el riego" });
    }

    res.json({ 
      message: "Riego confirmado exitosamente"
    });
  } catch (error) {
    console.error("Error al confirmar riego:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener irrigaciones aprobadas de un árbol específico
export const getTreeIrrigationEvidence = async (req, res) => {
  const { treeId } = req.params;

  if (!treeId) {
    return res.status(400).json({ message: "Tree ID es requerido" });
  }

  try {
    const [result] = await pool.query(
      `
      SELECT 
        irrigation.id AS irrigationId,
        irrigation.evidence,
        irrigation.registerDate,
        irrigation.observations,
        irrigation.status
      FROM irrigation
      WHERE irrigation.treeId = ? AND irrigation.status IN (1, 2) AND irrigation.evidence IS NOT NULL
      ORDER BY irrigation.registerDate DESC
      LIMIT 10
    `,
      [treeId],
    );

    res.json(result);
  } catch (error) {
    console.error("Error al obtener evidencia de riego:", error.message);
    res.status(500).json({ message: error.message });
  }
};
