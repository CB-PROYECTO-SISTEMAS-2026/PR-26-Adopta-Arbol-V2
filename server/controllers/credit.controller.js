import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";

// Obtener todas las compras (purchases) con datos del usuario y opción de crédito
export const getAllPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.qrcodeId,
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.creditId,
        p.adminId,
        u.name, 
        u.lastName,
        u.email,
        u.credits,
        c.price,
        c.purchased,
        c.bonus
      FROM purchase p
      JOIN user u ON p.userId = u.id
      LEFT JOIN credit c ON p.creditId = c.id
      ORDER BY p.registerDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error in getAllPurchases:", error);
    res.status(500).json({ message: "Error al obtener compras" });
  }
};

// Obtener compras pendientes
export const getPendingPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.qrcodeId,
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.creditId,
        p.adminId,
        u.name, 
        u.lastName,
        u.email,
        u.credits,
        c.price,
        c.purchased,
        c.bonus
      FROM purchase p
      JOIN user u ON p.userId = u.id
      LEFT JOIN credit c ON p.creditId = c.id
      WHERE p.status = 2
      ORDER BY p.registerDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error in getPendingPurchases:", error);
    res.status(500).json({ message: "Error al obtener compras pendientes" });
  }
};

// Aprobar compra
export const approvePurchase = async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body; // Recibir adminId del frontend
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener datos de la compra con los créditos de la opción seleccionada
    const [purchaseData] = await connection.query(
      `
      SELECT p.userId, c.purchased, c.bonus 
      FROM purchase p 
      JOIN user u ON p.userId = u.id 
      LEFT JOIN credit c ON p.creditId = c.id 
      WHERE p.id = ?
    `,
      [id],
    );

    if (purchaseData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    const { userId, purchased, bonus } = purchaseData[0];
    const creditsToAdd = parseFloat(purchased) + parseFloat(bonus); // Total de créditos a agregar
    const finalAdminId = adminId || 1; // Fallback a 1 si no se proporciona

    console.log("Aprobando compra con adminId:", finalAdminId);
    console.log("Créditos a agregar:", creditsToAdd);

    // Actualizar estado de la compra
    await connection.query(
      `
      UPDATE purchase 
      SET status = 1, adminId = ?, lastUpdate = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      [finalAdminId, id],
    );

    // Actualizar créditos del usuario
    await connection.query(
      `
      UPDATE user 
      SET credits = credits + ? 
      WHERE id = ?
    `,
      [creditsToAdd, userId],
    );

    await connection.commit();

    // Crear notificación para el usuario
    try {
      await createNotification(
        userId,
        "credits_purchased",
        "¡Compra de Créditos Aprobada!",
        `Tu compra de ${creditsToAdd} créditos ha sido aprobada. Ya puedes usarlos para adoptar árboles.`,
        id,
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }

    res.json({ message: "Compra aprobada exitosamente" });
  } catch (error) {
    await connection.rollback();
    console.error("Error in approvePurchase:", error);
    res.status(500).json({ message: "Error al aprobar compra" });
  } finally {
    connection.release();
  }
};

// Rechazar compra
export const rejectPurchase = async (req, res) => {
  const { id } = req.params;
  const { adminId } = req.body; // Recibir adminId del frontend

  try {
    const finalAdminId = adminId || 1; // Fallback a 1 si no se proporciona

    console.log("Rechazando compra con adminId:", finalAdminId);

    await pool.query(
      `
      UPDATE purchase 
      SET status = 0, adminId = ?, lastUpdate = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      [finalAdminId, id],
    );

    res.json({ message: "Compra rechazada" });
  } catch (error) {
    console.error("Error in rejectPurchase:", error);
    res.status(500).json({ message: "Error al rechazar compra" });
  }
};

// Obtener detalles de una compra específica
export const getPurchaseDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        p.id, 
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.adminId,
        p.creditId,
        u.name, 
        u.lastName,
        u.email,
        u.credits,
        c.price,
        c.purchased,
        c.bonus
      FROM purchase p
      JOIN user u ON p.userId = u.id
      LEFT JOIN credit c ON p.creditId = c.id
      WHERE p.id = ?
    `,
      [id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error in getPurchaseDetails:", error);
    res.status(500).json({ message: "Error al obtener detalles de la compra" });
  }
};

// ========================================
// FUNCIONES PARA TABLA DE OPCIONES: credit
// ========================================

// Obtener todas las opciones de crédito activas
export const getAllCreditOptions = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, 
        price, 
        purchased, 
        bonus, 
        status, 
        registerDate, 
        lastUpdate
      FROM credit
      WHERE status = 1
      ORDER BY purchased ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error("Error in getAllCreditOptions:", error);
    res.status(500).json({ message: "Error al obtener opciones de crédito" });
  }
};

// Obtener una opción de crédito específica por ID
export const getCreditOptionById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `
      SELECT 
        id, 
        price, 
        purchased, 
        bonus, 
        status, 
        registerDate, 
        lastUpdate
      FROM credit
      WHERE id = ? AND status = 1
    `,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Opción de crédito no encontrada" });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Error in getCreditOptionById:", error);
    res.status(500).json({ message: "Error al obtener opción de crédito" });
  }
};

// Crear nueva opción de crédito (Admin only)
export const createCreditOption = async (req, res) => {
  const { price, purchased, bonus = 0 } = req.body;

  try {
    // Validar datos requeridos
    if (!price || !purchased) {
      return res
        .status(400)
        .json({ message: "Faltan datos requeridos: price y purchased" });
    }

    const [result] = await pool.query(
      `
      INSERT INTO credit (price, purchased, bonus, status)
      VALUES (?, ?, ?, 1)
    `,
      [price, purchased, bonus],
    );

    res.json({
      id: result.insertId,
      price,
      purchased,
      bonus,
      status: 1,
      message: "Opción de crédito creada exitosamente",
    });
  } catch (error) {
    console.error("Error in createCreditOption:", error);
    res.status(500).json({ message: "Error al crear opción de crédito" });
  }
};

// Actualizar opción de crédito (Admin only)
export const updateCreditOption = async (req, res) => {
  const { id } = req.params;
  const { price, purchased, bonus } = req.body;

  try {
    const [result] = await pool.query(
      `
      UPDATE credit
      SET 
        price = COALESCE(?, price),
        purchased = COALESCE(?, purchased),
        bonus = COALESCE(?, bonus),
        lastUpdate = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [price, purchased, bonus, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Opción de crédito no encontrada" });
    }

    res.json({ message: "Opción de crédito actualizada exitosamente" });
  } catch (error) {
    console.error("Error in updateCreditOption:", error);
    res.status(500).json({ message: "Error al actualizar opción de crédito" });
  }
};

// Eliminar (delete lógico) opción de crédito (Admin only)
export const deleteCreditOption = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      `
      UPDATE credit
      SET status = 0, lastUpdate = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Opción de crédito no encontrada" });
    }

    res.json({ message: "Opción de crédito eliminada exitosamente" });
  } catch (error) {
    console.error("Error in deleteCreditOption:", error);
    res.status(500).json({ message: "Error al eliminar opción de crédito" });
  }
};
