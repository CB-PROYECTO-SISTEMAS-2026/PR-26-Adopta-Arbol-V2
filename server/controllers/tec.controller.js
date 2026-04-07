import { pool } from "../db.js";
import path from "path";
import fs from "fs";
import multer from "multer";

// Carpeta para imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.resolve("public/Tree");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `tree-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({ storage });

// Generar código único sin repetir
async function generarCodigoUnico() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let exists = true;

  while (exists) {
    code =
      "TR" +
      Array.from(
        { length: 3 },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");
    const [rows] = await pool.query("SELECT id FROM tree WHERE code = ?", [
      code,
    ]);
    if (rows.length === 0) exists = false;
  }

  return code;
}

// Registrar árbol + multimedia
export const registerTree = async (req, res) => {
  const {
    name,
    description,
    latitude,
    longitude,
    price,
    address,
    userId,
    categoryId,
  } = req.body;
  const imageFiles = req.files;

  if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
    return res
      .status(400)
      .json({ message: "Debes subir al menos una imagen del árbol" });
  }

  const imagePaths = imageFiles.map((file) => `/Tree/${file.filename}`);

  try {
    // Generar código único
    const code = await generarCodigoUnico();

    // Insertar árbol
    const [treeResult] = await pool.query(
      `INSERT INTO tree 
        (name, description, code, latitude, longitude, price, address, status, userId, categoryId)
       VALUES (?, ?, ?, ?, ?, ?, ?, 2, ?, ?)`,
      [
        name,
        description,
        code,
        latitude,
        longitude,
        price,
        address || null,
        userId,
        categoryId,
      ],
    );

    const treeId = treeResult.insertId;

    // Insertar multimedia
    for (const imagePath of imagePaths) {
      await pool.query(
        `INSERT INTO multimedia (treeId, path, status) VALUES (?, ?, 2)`,
        [treeId, imagePath],
      );
    }

    res.status(201).json({
      message: "Árbol registrado con imágenes correctamente",
      treeId,
      code,
      imagePaths,
    });
  } catch (error) {
    console.error("Error al registrar árbol:", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener categorías activas
export const getCategories = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, name FROM category WHERE status = 1 ORDER BY name ASC`,
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
