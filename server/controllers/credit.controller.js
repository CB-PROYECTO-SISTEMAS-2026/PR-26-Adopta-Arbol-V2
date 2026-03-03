import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";

// Obtener todas las compras (purchases) con datos del usuario
export const getAllPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.adminId,
        u.name, 
        u.lastName,
        u.email,
        u.credits
      FROM purchase p
      JOIN user u ON p.userId = u.id
      ORDER BY p.registerDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error in getAllPurchases:', error);
    res.status(500).json({ message: "Error al obtener compras" });
  }
};

// Obtener compras pendientes
export const getPendingPurchases = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.adminId,
        u.name, 
        u.lastName,
        u.email,
        u.credits
      FROM purchase p
      JOIN user u ON p.userId = u.id
      WHERE p.status = 2
      ORDER BY p.registerDate DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error in getPendingPurchases:', error);
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
    
    // Obtener datos de la compra
    const [purchaseData] = await connection.query(`
      SELECT p.userId, p.amount, u.credits as previousAmount 
      FROM purchase p 
      JOIN user u ON p.userId = u.id 
      WHERE p.id = ?
    `, [id]);
    
    if (purchaseData.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Compra no encontrada" });
    }
    
    const { userId, amount, previousAmount } = purchaseData[0];
    const finalAdminId = adminId || 1; // Fallback a 1 si no se proporciona
    
    console.log("Aprobando compra con adminId:", finalAdminId);
    
    // Actualizar estado de la compra
    await connection.query(`
      UPDATE purchase 
      SET status = 1, adminId = ?, lastUpdate = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [finalAdminId, id]);
    
    // Actualizar créditos del usuario
    await connection.query(`
      UPDATE user 
      SET credits = credits + ? 
      WHERE id = ?
    `, [amount, userId]);
    
    // Registrar modificación de créditos
    await connection.query(`
      INSERT INTO creditsmodification (userId, previousAmount, status, registerDate, modifiedBy) 
      VALUES (?, ?, 1, CURRENT_TIMESTAMP, ?)
    `, [userId, previousAmount, finalAdminId]);
    
    await connection.commit();
    
    // Crear notificación para el usuario
    try {
      await createNotification(
        userId,
        "credits_purchased",
        "¡Compra de Créditos Aprobada!",
        `Tu compra de ${amount} créditos ha sido aprobada. Ya puedes usarlos para adoptar árboles.`,
        id
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }
    
    res.json({ message: "Compra aprobada exitosamente" });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error in approvePurchase:', error);
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
    
    await pool.query(`
      UPDATE purchase 
      SET status = 0, adminId = ?, lastUpdate = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [finalAdminId, id]);
    
    res.json({ message: "Compra rechazada" });
  } catch (error) {
    console.error('Error in rejectPurchase:', error);
    res.status(500).json({ message: "Error al rechazar compra" });
  }
};

// Obtener detalles de una compra específica
export const getPurchaseDetails = async (req, res) => {
  const { id } = req.params;
  
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id, 
        p.amount, 
        p.receipt, 
        p.registerDate, 
        p.lastUpdate,
        p.status, 
        p.userId,
        p.adminId,
        u.name, 
        u.lastName,
        u.email,
        u.credits
      FROM purchase p
      JOIN user u ON p.userId = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Compra no encontrada" });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error in getPurchaseDetails:', error);
    res.status(500).json({ message: "Error al obtener detalles de la compra" });
  }
};
