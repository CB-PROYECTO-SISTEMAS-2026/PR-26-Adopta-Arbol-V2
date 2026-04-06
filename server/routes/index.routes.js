import { Router } from "express";
import { pool } from "../db.js";
const router = Router();

// Health check liviano para Render (no depende de base de datos)
router.get("/ping", (req, res) => {
  res.status(200).json({ ok: true, service: "backend" });
});

// Diagnóstico de base de datos
router.get("/ping-db", async (req, res) => {
  const [rows] = await pool.query("SELECT 1 + 1 AS result");
  res.json({ ok: true, db: rows });
});

//

export default router;
