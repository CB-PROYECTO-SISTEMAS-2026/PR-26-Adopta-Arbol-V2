import { createPool } from "mysql2/promise";

const normalizeEnv = (value) => {
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  if (!trimmed) return "";

  const hasDoubleQuotes =
    trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2;
  const hasSingleQuotes =
    trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2;

  return hasDoubleQuotes || hasSingleQuotes ? trimmed.slice(1, -1) : trimmed;
};

const dbHost = normalizeEnv(process.env.DB_HOST) || "localhost";
const dbUser = normalizeEnv(process.env.DB_USER) || "root";
const dbPassword = normalizeEnv(process.env.DB_PASSWORD) || "";
const dbName = normalizeEnv(process.env.DB_NAME) || "adoptaarbol_database_db";
const dbPort = Number.parseInt(normalizeEnv(process.env.DB_PORT) || "3306", 10);

// Definición del pool de conexiones
export const pool = createPool({
  host: dbHost,
  port: Number.isNaN(dbPort) ? 3306 : dbPort,
  user: dbUser,
  password: dbPassword,
  database: dbName,
  decimalNumbers: true, // Esto asegura que DECIMAL(10,2) se devuelva como número, no string
});
