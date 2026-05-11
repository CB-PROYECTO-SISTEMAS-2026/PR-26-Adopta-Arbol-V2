import { pool } from "../db.js";

// Obtener todas las categorías activas (status = 1) con datos del usuario
export const getCategories = async (req, res) => {
  try {
    console.log("=== NUEVO CONTROLADOR DE CATEGORÍAS ===");
    console.log("Ejecutando consulta de categorías...");
    
    const query = `
      SELECT category.id, category.name, category.status, category.registerDate, 
             category.lastUpdate, category.userId, user.name AS userName, user.lastName AS userLastName 
      FROM category
      JOIN user ON category.userId = user.id
      WHERE category.status = 1
      ORDER BY category.registerDate DESC
    `;
    
    console.log("Query SQL:", query);
    const [result] = await pool.query(query);
    
    console.log("Categorías obtenidas:", result.length);
    if (result.length > 0) {
      console.log("Primera categoría completa:", JSON.stringify(result[0], null, 2));
      console.log("Campos de la primera categoría:", Object.keys(result[0]));
    }
    
    console.log("Enviando respuesta al cliente...");
    console.log("Tamaño de la respuesta:", JSON.stringify(result).length);
    
    res.json(result);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);
    console.error("Stack trace:", error.stack);
    res.status(500).json({ message: error.message });
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
      [name.trim()]
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
      [name.trim(), userId]
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
      [id]
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Verificar si ya existe otra categoría con el mismo nombre
    const [existing] = await pool.query(
      "SELECT id FROM category WHERE name = ? AND status = 1 AND id != ?",
      [name.trim(), id]
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
      [name.trim(), userId, id]
    );

    res.json({ message: "Categoría actualizada exitosamente" });
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
      [id]
    );

    if (category.length === 0) {
      return res.status(404).json({ message: "Categoría no encontrada" });
    }

    // Desactivar la categoría (cambiar status a 0)
    await pool.query(
      `UPDATE category 
       SET status = 0, lastUpdate = CURRENT_TIMESTAMP, userId = ?
       WHERE id = ?`,
      [userId, id]
    );

    res.json({ message: "Categoría eliminada exitosamente" });
  } catch (error) {
    console.error("Error al eliminar la categoría:", error.message);
    res.status(500).json({ message: error.message });
  }
};
