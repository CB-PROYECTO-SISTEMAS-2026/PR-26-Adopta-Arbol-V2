import { pool } from "../db.js";

// Crear una nueva notificación
export const createNotification = async (userId, type, title, message, relatedId = null) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.query(
      `INSERT INTO notification (userId, type, title, message, relatedId) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, type, title, message, relatedId]
    );
    return result.insertId;
  } catch (error) {
    console.error("Error al crear notificación:", error.message);
    throw error;
  } finally {
    connection.release();
  }
};

// Obtener todas las notificaciones de un usuario
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const [rows] = await pool.query(
      `SELECT id, type, title, message, isRead, status, createdAt, readAt, relatedId
       FROM notification 
       WHERE userId = ? AND status = 1 
       ORDER BY createdAt DESC 
       LIMIT ?`,
      [userId, parseInt(limit)]
    );
    
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener notificaciones:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener notificaciones no leídas de un usuario
export const getUnreadNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const [rows] = await pool.query(
      `SELECT COUNT(*) as count 
       FROM notification 
       WHERE userId = ? AND isRead = 0 AND status = 1`,
      [userId]
    );
    
    res.json({ count: rows[0].count || 0 });
  } catch (error) {
    console.error("Error al obtener notificaciones no leídas:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Marcar notificación como leída
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      `UPDATE notification 
       SET isRead = 1, readAt = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [id]
    );
    
    res.json({ message: "Notificación marcada como leída" });
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Marcar todas las notificaciones de un usuario como leídas
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await pool.query(
      `UPDATE notification 
       SET isRead = 1, readAt = CURRENT_TIMESTAMP 
       WHERE userId = ? AND isRead = 0`,
      [userId]
    );
    
    res.json({ message: "Todas las notificaciones han sido marcadas como leídas" });
  } catch (error) {
    console.error("Error al marcar todas como leídas:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar una notificación (eliminación lógica)
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      `UPDATE notification SET status = 0 WHERE id = ?`,
      [id]
    );
    
    res.json({ message: "Notificación eliminada" });
  } catch (error) {
    console.error("Error al eliminar notificación:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar todas las notificaciones de un usuario (eliminación lógica)
export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await pool.query(
      `UPDATE notification SET status = 0 WHERE userId = ?`,
      [userId]
    );
    
    res.json({ message: "Todas las notificaciones han sido eliminadas" });
  } catch (error) {
    console.error("Error al eliminar todas las notificaciones:", error.message);
    res.status(500).json({ message: error.message });
  }
};
