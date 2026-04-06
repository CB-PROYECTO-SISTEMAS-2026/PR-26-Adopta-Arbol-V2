import { pool } from "../db.js";
import { sendUserCredentials } from "../services/emailService.js";
import bcrypt from "bcrypt";

// Login de usuario
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        message: "Nombre de usuario y contraseña son requeridos",
      });
    }

    const [result] = await pool.query(
      "SELECT id, name, lastName, role, username, email, photo, credits, point, status, registerDate, password FROM user WHERE username = ? AND status = 1 AND (password = SHA2(?, 256) OR password = ?)",
      [username, password, password],
    );

    if (result.length === 0) {
      return res.status(401).json({
        message: "Credenciales inválidas",
      });
    }

    const user = result[0];

    // Migración transparente: si la contraseña estaba en texto plano, se actualiza a SHA-256.
    if (user.password === password) {
      await pool.query("UPDATE user SET password = SHA2(?, 256) WHERE id = ?", [
        password,
        user.id,
      ]);
      console.log(
        "🔐 Contraseña migrada a SHA-256 para usuario:",
        user.username,
      );
    }

    const { password: _storedPassword, ...safeUser } = user;

    console.log("=== LOGIN USER DATA ===");
    console.log("User from DB:", safeUser);
    console.log(
      "User credits:",
      safeUser.credits,
      "Type:",
      typeof safeUser.credits,
    );

    res.json({
      message: "Inicio de Sesión exitoso",
      user: {
        id: safeUser.id,
        name: safeUser.name,
        lastName: safeUser.lastName,
        role: safeUser.role,
        username: safeUser.username,
        email: safeUser.email,
        photo: safeUser.photo,
        credits: safeUser.credits,
        point: safeUser.point,
        registerDate: safeUser.registerDate,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUsers = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT id, name, lastName, role, username, email, photo, credits, point, status, registerDate, lastUpdate, userId FROM user WHERE status IN (1, 2) ORDER BY registerDate DESC;",
    );

    console.log(result);

    res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getUser = async (req, res) => {
  try {
    console.log("=== GET USER BY ID ===");
    console.log("Requested user ID:", req.params.id);

    const [result] = await pool.query(
      "SELECT id, name, lastName, role, username, email, photo, credits, point, status, registerDate, lastUpdate, userId FROM user WHERE id = ? AND status = 1",
      [req.params.id],
    );

    console.log("Query result:", result);

    if (result.length === 0) {
      console.log("User not found for ID:", req.params.id);
      return res.status(404).json({ message: "User not found" });
    }

    const user = result[0];
    console.log("Returning user:", user);
    console.log("User credits:", user.credits, "Type:", typeof user.credits);
    res.json(user);
  } catch (error) {
    console.error("Error in getUser:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    console.log("Datos recibidos:", req.body);

    const {
      name,
      lastName,
      role,
      username,
      password,
      email,
      photo = null,
      credits = 0,
      point = 0,
      status = 1,
      userId: requestedUserId,
    } = req.body;

    // Validar campos requeridos
    if (!name || !lastName || !role || !username || !password || !email) {
      return res.status(400).json({
        message:
          "Campos requeridos: name, lastName, role, username, password, email",
      });
    }

    // Verificar si ya existe algún usuario
    const [existingUsers] = await pool.query(
      "SELECT COUNT(*) as count FROM user",
    );
    const userCount = existingUsers[0].count;

    // Si no hay usuarios, este será el primero (sin supervisor)
    // Si ya hay usuarios, usar el userId enviado desde el frontend (usuario logueado)
    let userId = userCount === 0 ? null : requestedUserId || 1;

    console.log("Número de usuarios existentes:", userCount);
    console.log("userId establecido como:", userId);
    console.log("userId solicitado desde frontend:", requestedUserId);

    // Guardar el password original para el email
    const originalPassword = password;

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      "INSERT INTO user(name, lastName, role, username, password, email, photo, credits, point, status, userId) VALUES(?,?,?, ?, SHA2(?, 256), ?, ?, ?, ?, ?, ?)",
      [
        name,
        lastName,
        role,
        username,
        hashedPassword,
        email,
        photo,
        credits,
        point,
        status,
        userId,
      ],
    );

    console.log("Usuario creado:", result);

    // Enviar credenciales por correo electrónico
    let emailSent = false;
    try {
      const emailResult = await sendUserCredentials(
        email,
        `${name} ${lastName}`,
        username,
        originalPassword,
      );

      if (emailResult.success) {
        emailSent = true;
        console.log("✅ Correo de credenciales enviado exitosamente");
      } else {
        console.warn("⚠️ Error al enviar correo:", emailResult.error);
      }
    } catch (emailError) {
      console.error("❌ Error crítico al enviar correo:", emailError);
      // No afecta la creación del usuario
    }

    res.status(201).json({
      id: result.insertId,
      name,
      lastName,
      role,
      username,
      email,
      photo,
      credits,
      point,
      status,
      userId,
      emailSent,
      message: emailSent
        ? "Usuario creado exitosamente y credenciales enviadas por correo"
        : "Usuario creado exitosamente. No fue posible enviar el correo con credenciales.",
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const [result] = await pool.query("UPDATE user SET ? WHERE id = ?;", [
      req.body,
      req.params.id,
    ]);

    console.log(result);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { deletedBy } = req.body; // Recibir ID del usuario que hace la baja
    const finalDeletedBy = deletedBy || 1; // Fallback a 1 si no se proporciona

    console.log("Dando de baja usuario con deletedBy:", finalDeletedBy);

    // Actualizar el usuario: cambiar status a 0 y registrar quién hizo la baja
    const [result] = await pool.query(
      "UPDATE user SET status = 0, lastUpdate = CURRENT_TIMESTAMP, userId = ? WHERE id = ?;",
      [finalDeletedBy, req.params.id],
    );

    console.log(result);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Usuario dado de baja exitosamente",
      deletedBy: finalDeletedBy,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// Registro de usuario (auto-registro)
export const registerUser = async (req, res) => {
  try {
    console.log("Datos de registro recibidos:", req.body);

    const { name, lastName, email, password } = req.body;

    // Validar campos requeridos
    if (!name || !lastName || !email || !password) {
      return res.status(400).json({
        message: "Campos requeridos: name, lastName, email, password",
      });
    }

    // Verificar si el email ya existe
    const [existingEmail] = await pool.query(
      "SELECT id FROM user WHERE email = ?",
      [email],
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({
        message: "El correo electrónico ya está registrado",
      });
    }

    // Generar username automáticamente
    const baseUsername = `${name.toLowerCase()}_${lastName.toLowerCase().charAt(0)}`;
    let username = baseUsername;
    let counter = 1;

    // Verificar si el username ya existe y generar uno único
    while (true) {
      const [existingUsername] = await pool.query(
        "SELECT id FROM user WHERE username = ?",
        [username],
      );

      if (existingUsername.length === 0) {
        break; // Username disponible
      }

      username = `${baseUsername}${counter}`;
      counter++;
    }

    console.log("Username generado:", username);

    // Crear el usuario activo con role = adoptante y contraseña hasheada en SHA-256
    const [result] = await pool.query(
      "INSERT INTO user(name, lastName, role, username, password, email, photo, credits, point, status, userId) VALUES(?,?,?, ?, SHA2(?, 256), ?, ?, ?, ?, ?, ?)",
      [
        name,
        lastName,
        "adoptante", // role por defecto
        username,
        hashedPassword,
        email,
        null, // photo
        0, // credits
        0, // point
        1, // status = 1 (activo)
        null, // userId = NULL
      ],
    );

    console.log("Usuario registrado:", result);

    // Enviar credenciales por correo electrónico (username generado + contraseña definida)
    let emailSent = false;
    try {
      const emailResult = await sendUserCredentials(
        email,
        `${name} ${lastName}`,
        username,
        password,
      );

      emailSent = emailResult.success;
      if (emailSent) {
        console.log("✅ Correo de credenciales enviado en registro");
      } else {
        console.warn(
          "⚠️ Registro creado, pero no se pudo enviar correo:",
          emailResult.error,
        );
      }
    } catch (emailError) {
      console.error(
        "❌ Error crítico al enviar correo en registro:",
        emailError,
      );
    }

    res.status(201).json({
      id: result.insertId,
      name,
      lastName,
      role: "adoptante",
      username,
      email,
      status: 1,
      emailSent,
      message: emailSent
        ? "Su cuenta ha sido creada exitosamente. Verifique sus credenciales de acceso en su correo electrónico."
        : "Su cuenta ha sido creada exitosamente. No fue posible enviar el correo con credenciales en este momento.",
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Aceptar usuario (cambiar status de 2 a 1)
export const acceptUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { acceptedBy } = req.body; // ID del usuario que acepta
    const finalAcceptedBy = acceptedBy || 1; // Fallback a 1 si no se proporciona

    console.log("Aceptando usuario con acceptedBy:", finalAcceptedBy);

    const [result] = await pool.query(
      "UPDATE user SET status = 1, lastUpdate = CURRENT_TIMESTAMP, userId = ? WHERE id = ? AND status = 2",
      [finalAcceptedBy, id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Usuario no encontrado o no está pendiente de aprobación",
      });
    }

    res.json({
      message: "Usuario aceptado exitosamente",
      acceptedBy: finalAcceptedBy,
    });
  } catch (error) {
    console.error("Error al aceptar usuario:", error);
    return res.status(500).json({ message: error.message });
  }
};

// Busqueda de usuarios mediante filtros
export const searchUsers = async (req, res) => {
  try {
    const [result] = await pool.query(
      "SELECT name, lastName, role, username, email, photo, credits, point, status, registerDate, lastUpdate, userId FROM user WHERE status = 2 AND (CONCAT(name, ' ', lastName) LIKE CONCAT('%', @valueName, '%') OR username LIKE CONCAT('%', @valueUser, '%') OR DATE(registerDate) BETWEEN @startDate AND @endDate) ORDER BY registerDate DESC;",
    );
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
