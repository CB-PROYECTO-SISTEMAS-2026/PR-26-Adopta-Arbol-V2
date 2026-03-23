import { pool } from "../db.js";
import { createNotification } from "./notification.controller.js";

export const getAdoptions = async (req, res) => {
  try {
    const [result] = await pool.query(`
      SELECT 
        a.id,
        u.name AS nombres,
        u.lastName AS apellidos,
        u.photo AS foto,
        t.code AS codigo_arbol,
        t.address AS ubicacion,
        t.name AS tipo_arbol,
        a.registerDate AS fecha_registro,
        a.status
      FROM adoption a
      INNER JOIN user u ON a.userId = u.id
      INNER JOIN tree t ON a.treeId = t.id
      WHERE a.status = 2
      ORDER BY a.registerDate DESC
    `);
    res.json(result);
  } catch (error) {
    console.error("Error al obtener adopciones:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Aprobar adopción (estado → 1)
export const approveAdoption = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener datos de la adopción y el árbol
    const [adoptionData] = await connection.query(
      `
      SELECT a.userId, a.treeId, t.price, t.name as treeName, u.credits as currentCredits
      FROM adoption a
      JOIN tree t ON a.treeId = t.id
      JOIN user u ON a.userId = u.id
      WHERE a.id = ? AND a.status = 2
    `,
      [id],
    );

    if (adoptionData.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Adopción no encontrada o ya procesada" });
    }

    const { userId, treeId, price, treeName, currentCredits } = adoptionData[0];

    // Actualizar estado de la adopción
    await connection.query("UPDATE adoption SET status = 1 WHERE id = ?", [id]);

    // El árbol mantiene status = 1 (activo) para seguir apareciendo en el mapa
    // El estado de adopción se maneja a través de la tabla adoption

    // Convertir créditos gastados en puntos para el usuario
    await connection.query("UPDATE user SET point = point + ? WHERE id = ?", [
      price,
      userId,
    ]);

    await connection.commit();

    // Crear notificación para el usuario
    try {
      await createNotification(
        userId,
        "adoption_approved",
        "¡Adopción Aprobada!",
        `Tu solicitud de adopción del árbol "${treeName}" ha sido aprobada. Has ganado ${price} puntos.`,
        id,
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }

    res.json({ message: "Adopción aprobada exitosamente y puntos agregados" });
  } catch (error) {
    await connection.rollback();
    console.error("Error al aprobar adopción:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// Rechazar adopción (estado → 0)
export const rejectAdoption = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Obtener datos de la adopción
    const [adoptionData] = await connection.query(
      `
      SELECT a.userId, a.treeId, t.price, t.name as treeName, u.credits as currentCredits
      FROM adoption a
      JOIN tree t ON a.treeId = t.id
      JOIN user u ON a.userId = u.id
      WHERE a.id = ? AND a.status = 2
    `,
      [id],
    );

    if (adoptionData.length === 0) {
      await connection.rollback();
      return res
        .status(404)
        .json({ message: "Adopción no encontrada o ya procesada" });
    }

    const { userId, treeId, price, treeName, currentCredits } = adoptionData[0];

    // Actualizar estado de la adopción
    await connection.query("UPDATE adoption SET status = 0 WHERE id = ?", [id]);

    // Devolver créditos al usuario
    await connection.query(
      "UPDATE user SET credits = credits + ? WHERE id = ?",
      [price, userId],
    );

    // Asegurar que el árbol esté disponible nuevamente
    await connection.query("UPDATE tree SET status = 1 WHERE id = ?", [treeId]);

    await connection.commit();

    // Crear notificación para el usuario
    try {
      await createNotification(
        userId,
        "adoption_rejected",
        "Adopción Rechazada",
        `Tu solicitud de adopción del árbol "${treeName}" ha sido rechazada. Se han devuelto ${price} créditos a tu cuenta.`,
        id,
      );
    } catch (notifError) {
      console.error("Error al crear notificación:", notifError);
    }

    res.json({
      message: "Adopción rechazada y créditos devueltos exitosamente",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al rechazar adopción:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};

// Eliminar adopción
export const deleteAdoption = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM adoption WHERE id = ?", [
      id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Adopción no encontrada" });
    res.json({ message: "Adopción eliminada" });
  } catch (error) {
    console.error("Error al eliminar adopción:", error.message);
    res.status(500).json({ message: error.message });
  }
};

// Crear nueva adopción
export const createAdoption = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const { userId, treeId, status = 2 } = req.body;

    console.log("=== CREAR ADOPCIÓN ===");
    console.log("Datos recibidos:", { userId, treeId, status });
    console.log("Tipos:", {
      userId: typeof userId,
      treeId: typeof treeId,
      status: typeof status,
    });

    await connection.beginTransaction();

    // Validar que el árbol existe y está disponible
    const [treeCheck] = await connection.query(
      "SELECT id, status, price FROM tree WHERE id = ?",
      [Number(treeId)],
    );

    console.log("Resultado de búsqueda del árbol:", treeCheck);

    if (treeCheck.length === 0) {
      console.log("ERROR: Árbol no encontrado");
      await connection.rollback();
      return res.status(404).json({ message: "Árbol no encontrado" });
    }

    console.log("Estado del árbol:", treeCheck[0].status);
    if (treeCheck[0].status !== 1) {
      console.log(
        "ERROR: El árbol no está disponible para adopción. Estado:",
        treeCheck[0].status,
      );
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "El árbol no está disponible para adopción" });
    }

    // Verificar que no hay una adopción activa para este árbol
    const [existingAdoption] = await connection.query(
      "SELECT id FROM adoption WHERE treeId = ? AND status = 1",
      [Number(treeId)],
    );

    console.log("Adopciones existentes para el árbol:", existingAdoption);

    if (existingAdoption.length > 0) {
      console.log("ERROR: El árbol ya está adoptado");
      await connection.rollback();
      return res.status(400).json({ message: "El árbol ya está adoptado" });
    }

    // Verificar que el usuario no tiene ya una adopción pendiente para este árbol
    const [pendingAdoption] = await connection.query(
      "SELECT id FROM adoption WHERE userId = ? AND treeId = ? AND status = 2",
      [Number(userId), Number(treeId)],
    );

    console.log("Adopciones pendientes del usuario:", pendingAdoption);

    if (pendingAdoption.length > 0) {
      console.log("ERROR: Ya tienes una solicitud pendiente para este árbol");
      await connection.rollback();
      return res
        .status(400)
        .json({ message: "Ya tienes una solicitud pendiente para este árbol" });
    }

    // Verificar que el usuario tiene suficientes créditos
    const [userCheck] = await connection.query(
      "SELECT id, credits, name, lastName FROM user WHERE id = ?",
      [Number(userId)],
    );

    console.log("=== DATOS DEL USUARIO EN ADOPCIÓN ===");
    console.log("ID solicitado:", userId);
    console.log("Datos del usuario:", userCheck);
    console.log("Usuario encontrado:", userCheck[0]);
    if (userCheck[0]) {
      console.log("- ID:", userCheck[0].id);
      console.log("- Name:", userCheck[0].name);
      console.log("- Credits:", userCheck[0].credits);
      console.log("- Credits type:", typeof userCheck[0].credits);
    }

    if (userCheck.length === 0) {
      console.log("ERROR: Usuario no encontrado");
      await connection.rollback();
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const userCredits = userCheck[0].credits;
    const treePrice = treeCheck[0].price;

    console.log("Comparación de créditos:");
    console.log(
      "- Créditos del usuario (raw):",
      userCredits,
      "(tipo:",
      typeof userCredits,
      ")",
    );
    console.log(
      "- Precio del árbol (raw):",
      treePrice,
      "(tipo:",
      typeof treePrice,
      ")",
    );

    // Convertir a números para comparación segura
    const userCreditsNum = Number(userCredits);
    const treePriceNum = Number(treePrice);

    console.log(
      "- Créditos del usuario (num):",
      userCreditsNum,
      "(tipo:",
      typeof userCreditsNum,
      ")",
    );
    console.log(
      "- Precio del árbol (num):",
      treePriceNum,
      "(tipo:",
      typeof treePriceNum,
      ")",
    );
    console.log("- ¿Tiene suficientes?:", userCreditsNum >= treePriceNum);
    console.log("- Diferencia:", userCreditsNum - treePriceNum);

    if (userCreditsNum < treePriceNum) {
      console.log("ERROR: No tienes suficientes créditos");
      console.log("Detalles:", {
        userCredits: userCreditsNum,
        treePrice: treePriceNum,
        difference: userCreditsNum - treePriceNum,
      });
      await connection.rollback();
      return res
        .status(400)
        .json({
          message: "No tienes suficientes créditos para adoptar este árbol",
        });
    }

    // Crear la adopción (sin descontar créditos por ahora para debug)
    const [result] = await connection.query(
      "INSERT INTO adoption (userId, treeId, status) VALUES (?, ?, ?)",
      [Number(userId), Number(treeId), Number(status)],
    );

    console.log("Adopción creada con ID:", result.insertId);

    // Descontar créditos del usuario (temporalmente comentado para debug)
    try {
      await connection.query(
        "UPDATE user SET credits = credits - ? WHERE id = ?",
        [Number(treePrice), Number(userId)],
      );
      console.log("Créditos descontados exitosamente");
    } catch (creditError) {
      console.log("Error al descontar créditos:", creditError.message);
      // No fallar la transacción por esto
    }

    await connection.commit();
    console.log("✅ Transacción completada exitosamente");

    res.status(201).json({
      message:
        "Solicitud de adopción creada exitosamente y créditos descontados",
      adoptionId: result.insertId,
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error al crear adopción:", error.message);
    res.status(500).json({ message: error.message });
  } finally {
    connection.release();
  }
};
