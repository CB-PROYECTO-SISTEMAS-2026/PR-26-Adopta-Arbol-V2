import { pool } from "../db.js";

// Obtener todas las categorías activas (status = 1) con datos del usuario
export const getCategories = async (req, res) => {
  try {
    console.log("Obteniendo categorías...");

    const [result] = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.status, 
        c.registerDate, 
        c.lastUpdate, 
        c.userId, 
        u.name AS userName, 
        u.lastName AS userLastName 
      FROM category c
      INNER JOIN user u ON c.userId = u.id
      WHERE c.status = 1
      ORDER BY c.registerDate DESC
    `);

    console.log("Categorías obtenidas:", result.length);
    console.log("Datos completos:", JSON.stringify(result, null, 2));

    res.json(result);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Crear una nueva categoría
export const createCategory = async (req, res) => {
  try {
    const { name, userId } = req.body;

    // Validaciones
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "El nombre de la categoría es requerido" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ message: "El ID del usuario es requerido" });
    }

    // Verificar si ya existe una categoría con el mismo nombre
    const [existing] = await pool.query(
      "SELECT id FROM category WHERE name = ? AND status = 1",
      [name.trim()],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya existe una categoría con ese nombre" });
    }

    // Insertar la nueva categoría
    const [result] = await pool.query(
      `INSERT INTO category (name, status, userId) 
       VALUES (?, 1, ?)`,
      [name.trim(), userId],
    );

    res.status(201).json({
      message: "Categoría creada exitosamente",
      id: result.insertId,
      name: name.trim(),
      status: 1,
      userId: userId,
    });
  } catch (error) {
    console.error("Error al crear la categoría:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Actualizar una categoría
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, userId } = req.body;

    // Validaciones
    if (!name || !name.trim()) {
      return res
        .status(400)
        .json({ message: "El nombre de la categoría es requerido" });
    }

    if (!userId) {
      return res
        .status(400)
        .json({ message: "El ID del usuario es requerido" });
    }

    // Verificar si la categoría existe
    const [category] = await pool.query(
      "SELECT id FROM category WHERE id = ? AND status = 1",
      [id],
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Verificar si ya existe otra categoría con el mismo nombre
    const [existing] = await pool.query(
      "SELECT id FROM category WHERE name = ? AND status = 1 AND id != ?",
      [name.trim(), id],
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ message: "Ya existe otra categoría con ese nombre" });
    }

    // Actualizar la categoría
    await pool.query(
      `UPDATE category 
       SET name = ?, lastUpdate = CURRENT_TIMESTAMP, userId = ?
       WHERE id = ?`,
      [name.trim(), userId, id],
    );

    res.json({
      message: "Categoría actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar la categoría:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Eliminar (desactivar) una categoría
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res
        .status(400)
        .json({ message: "El ID del usuario es requerido" });
    }

    // Verificar si la categoría existe
    const [category] = await pool.query(
      "SELECT id FROM category WHERE id = ? AND status = 1",
      [id],
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Desactivar la categoría (cambiar status a 0)
    await pool.query(
      `UPDATE category 
       SET status = 0, lastUpdate = CURRENT_TIMESTAMP, userId = ?
       WHERE id = ?`,
      [userId, id],
    );

    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la categoría:", error.message);
    res.status(500).json({ message: error.message });
  }
};
