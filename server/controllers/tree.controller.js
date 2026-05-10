import { pool } from "../db.js";

// Obtener todos los árboles con estado 2
export const getTrees = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        tree.id, 
        tree.name, 
        tree.description, 
        tree.code, 
        tree.price, 
        tree.address, 
        tree.registerDate, 
        tree.status, 
        user.name AS userName, 
        user.lastName AS userLastName,
        GROUP_CONCAT(multimedia.path ORDER BY multimedia.id) AS imagePaths
      FROM tree
      JOIN user ON tree.userId = user.id
      LEFT JOIN multimedia ON tree.id = multimedia.treeId AND multimedia.status = 2
      WHERE tree.status = 2
      GROUP BY 
        tree.id,
        tree.name,
        tree.description,
        tree.code,
        tree.price,
        tree.address,
        tree.registerDate,
        tree.status,
        user.name,
        user.lastName
      ORDER BY tree.registerDate DESC
    `);

    const trees = result.map((tree) => {
      const paths = tree.imagePaths
        ? tree.imagePaths
            .split(",")
            .map((path) => path.trim())
            .filter(Boolean)
        : [];

      return {
        ...tree,
        imagePaths: paths,
        imagePath: paths[0] || null,
      };
    });

    res.json(trees); // Devuelve los árboles en formato JSON
  } catch (error) {
    console.error("Error al obtener los árboles:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los árboles sin importar status (para admin)
export const getAllTreesForAdmin = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        tree.id, 
        tree.name, 
        tree.description, 
        tree.code, 
        tree.price, 
        tree.address, 
        tree.registerDate, 
        tree.status, 
        user.name AS userName, 
        user.lastName AS userLastName,
        GROUP_CONCAT(multimedia.path ORDER BY multimedia.id) AS imagePaths
      FROM tree
      JOIN user ON tree.userId = user.id
      LEFT JOIN multimedia ON tree.id = multimedia.treeId AND multimedia.status = 2
      GROUP BY 
        tree.id,
        tree.name,
        tree.description,
        tree.code,
        tree.price,
        tree.address,
        tree.registerDate,
        tree.status,
        user.name,
        user.lastName
      ORDER BY tree.registerDate DESC
    `);

    const trees = result.map((tree) => {
      const paths = tree.imagePaths
        ? tree.imagePaths
            .split(",")
            .map((path) => path.trim())
            .filter(Boolean)
        : [];

      return {
        ...tree,
        imagePaths: paths,
        imagePath: paths[0] || null,
      };
    });

    res.json(trees);
  } catch (error) {
    console.error("Error al obtener todos los árboles:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Cambiar el estado de un árbol a 1 (activo)
export const setTreeStateToActive = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE tree SET status = 1 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Árbol no encontrado" });
    }

    res.json({ message: "Estado del árbol cambiado a 1 (activo)" });
  } catch (error) {
    console.error("Error al cambiar el estado del árbol:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Cambiar el estado de un árbol a 0
export const setTreeStateToInactive = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      "UPDATE tree SET status = 0 WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Árbol no encontrado" });
    }

    res.json({ message: "Estado del árbol cambiado a 0 (inactivo)" });
  } catch (error) {
    console.error("Error al cambiar el estado del árbol:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener todos los árboles con estado de adopción
export const getAllTreesWithAdoptionStatus = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        t.id, 
        t.name, 
        t.description, 
        t.code, 
        t.latitude, 
        t.longitude, 
        t.price, 
        t.address, 
        t.status, 
        t.registerDate,
        CASE 
          WHEN a.id IS NOT NULL AND a.status = 1 THEN 1 
          WHEN a.id IS NOT NULL AND a.status = 2 THEN 2
          ELSE 0 
        END as isAdopted,
        CASE 
          WHEN a.id IS NOT NULL AND a.status = 1 THEN CONCAT(u.name, ' ', u.lastName)
          WHEN a.id IS NOT NULL AND a.status = 2 THEN CONCAT(u.name, ' ', u.lastName)
          ELSE NULL 
        END as currentOwner,
        CASE 
          WHEN a.id IS NOT NULL AND a.status = 2 THEN a.status
          ELSE NULL 
        END as adoptionStatus
      FROM tree t
      LEFT JOIN adoption a ON t.id = a.treeId AND (a.status = 1 OR a.status = 2)
      LEFT JOIN user u ON a.userId = u.id
      WHERE t.status = 1
      ORDER BY t.registerDate DESC
    `);
    res.json(result);
  } catch (error) {
    console.error(
      "Error al obtener árboles con estado de adopción:",
      error.message,
    );
    res.status(500).json({ message: error.message });
  }
};

// Obtener estadísticas de adopción: árboles adoptados vs no adoptados
export const getAdoptionStats = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        COUNT(DISTINCT t.id) as totalTrees,
        COUNT(DISTINCT CASE 
          WHEN a.id IS NOT NULL AND a.status = 1 THEN t.id 
        END) as adoptedTrees,
        COUNT(DISTINCT CASE 
          WHEN a.id IS NULL OR (a.id IS NOT NULL AND a.status != 1) THEN t.id 
        END) as notAdoptedTrees
      FROM tree t
      LEFT JOIN adoption a ON t.id = a.treeId AND a.status = 1
      WHERE t.status = 1
    `);
    
    res.json(result[0] || { totalTrees: 0, adoptedTrees: 0, notAdoptedTrees: 0 });
  } catch (error) {
    console.error("Error al obtener estadísticas de adopción:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener conteo de árboles por categoría
export const getTreesByCategory = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        c.id,
        c.name,
        COUNT(t.id) as count
      FROM category c
      LEFT JOIN tree t ON c.id = t.categoryId AND t.status = 1
      WHERE c.status = 1
      GROUP BY c.id, c.name
      ORDER BY count DESC
    `);
    
    res.json(result || []);
  } catch (error) {
    console.error("Error al obtener árboles por categoría:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener historial de un árbol específico
export const getTreeHistory = async (req, res) => {
  try {
    const { treeId } = req.params;

    // Obtener información del árbol con imagen
    const [treeInfo] = await pool.query(
      `
      SELECT 
        t.*,
        CASE 
          WHEN a.id IS NOT NULL AND a.status = 1 THEN CONCAT(u.name, ' ', u.lastName)
          ELSE NULL 
        END as currentOwner
      FROM tree t
      LEFT JOIN adoption a ON t.id = a.treeId AND a.status = 1
      LEFT JOIN user u ON a.userId = u.id
      WHERE t.id = ?
      LIMIT 1
    `,
      [treeId],
    );

    const [imageRows] = await pool.query(
      `
      SELECT path
      FROM multimedia
      WHERE treeId = ? AND status = 2
      ORDER BY id
    `,
      [treeId],
    );

    // Obtener historial de riegos
    const [irrigations] = await pool.query(
      `
      SELECT i.*, u.name as userName, u.lastName as userLastName
      FROM irrigation i
      JOIN user u ON i.userId = u.id
      WHERE i.treeId = ? AND i.status = 1
      ORDER BY i.registerDate DESC
    `,
      [treeId],
    );

    // Obtener dueños anteriores
    const [previousOwners] = await pool.query(
      `
      SELECT 
        a.id,
        a.registerDate as adoptionDate,
        a.lastUpdate as abandonmentDate,
        u.name as userName,
        u.lastName as userLastName
      FROM adoption a
      JOIN user u ON a.userId = u.id
      WHERE a.treeId = ?
      ORDER BY a.registerDate DESC
    `,
      [treeId],
    );

    // Log para depuración
    console.log("Tree ID:", treeId);
    const treeData = treeInfo[0] || null;
    let formattedTree = null;

    if (treeData) {
      const pathSet = new Set();
      const imagePaths = [];

      imageRows.forEach((row) => {
        if (!row?.path) return;
        const rawPath = String(row.path).trim();
        if (!rawPath) return;

        const normalizedKey = rawPath
          .replace(/^https?:\/\/[^/]+/i, "")
          .replace(/\/{2,}/g, "/")
          .toLowerCase();

        if (!pathSet.has(normalizedKey)) {
          pathSet.add(normalizedKey);
          imagePaths.push(rawPath);
        }
      });

      formattedTree = {
        ...treeData,
        imagePaths,
        imagePath: imagePaths[0] || null,
      };
    }

    console.log("Tree Info:", JSON.stringify(formattedTree, null, 2));
    console.log("Image Paths:", formattedTree?.imagePaths);

    res.json({
      tree: formattedTree,
      currentOwner: formattedTree?.currentOwner || null,
      irrigations: irrigations || [],
      previousOwners: previousOwners || [],
    });
  } catch (error) {
    console.error("Error al obtener historial del árbol:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Obtener los árboles adoptados por el usuario actual
export const getMyTrees = async (req, res) => {
  try {
    // Obtener el ID del usuario desde el token o sesión
    const userId = req.user?.id || req.headers["user-id"];

    if (!userId) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    const [result] = await pool.query(
      `
      SELECT t.id, t.name, t.description, t.code, t.price, t.address, 
             t.latitude, t.longitude, t.registerDate, t.status,
             a.registerDate as adoptionDate, a.status as adoptionStatus,
             (
               SELECT m.path
               FROM multimedia m
               WHERE m.treeId = t.id AND m.status = 2
               ORDER BY m.id ASC
               LIMIT 1
             ) as imagePath
      FROM tree t
      JOIN adoption a ON t.id = a.treeId
      WHERE a.userId = ? AND a.status IN (1, 2)
      ORDER BY a.registerDate DESC
    `,
      [userId],
    );

    res.json(result);
  } catch (error) {
    console.error("Error al obtener mis árboles:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Renombrar un árbol
export const renameTree = async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  const userId = req.user?.id || req.headers["user-id"];

  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  if (!name || name.trim().length === 0) {
    return res
      .status(400)
      .json({ message: "El nombre del árbol es requerido" });
  }

  try {
    // Verificar que el usuario sea el dueño del árbol
    const [ownershipCheck] = await pool.query(
      `
      SELECT a.id FROM adoption a 
      WHERE a.treeId = ? AND a.userId = ? AND a.status = 1
    `,
      [id, userId],
    );

    if (ownershipCheck.length === 0) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para renombrar este árbol" });
    }

    // Actualizar el nombre del árbol
    const [result] = await pool.query("UPDATE tree SET name = ? WHERE id = ?", [
      name.trim(),
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Árbol no encontrado" });
    }

    res.json({ message: "Nombre del árbol actualizado exitosamente" });
  } catch (error) {
    console.error("Error al renombrar el árbol:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Abandonar un árbol (eliminar de mis árboles)
export const abandonTree = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.headers["user-id"];

  if (!userId) {
    return res.status(401).json({ message: "Usuario no autenticado" });
  }

  try {
    // Verificar que el usuario sea el dueño del árbol
    const [ownershipCheck] = await pool.query(
      `
      SELECT a.id FROM adoption a 
      WHERE a.treeId = ? AND a.userId = ? AND a.status = 1
    `,
      [id, userId],
    );

    if (ownershipCheck.length === 0) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para abandonar este árbol" });
    }

    // Actualizar el estado de adopción a abandonado (status = 0)
    const [result] = await pool.query(
      "UPDATE adoption SET status = 0, lastUpdate = NOW() WHERE treeId = ? AND userId = ? AND status = 1",
      [id, userId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Adopción no encontrada" });
    }

    res.json({ message: "Árbol abandonado exitosamente" });
  } catch (error) {
    console.error("Error al abandonar el árbol:", error.message);
    res.status(500).json({ message: error.message });
  }
};
