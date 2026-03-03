import { createPool } from "mysql2/promise";

// Definición del pool de conexiones
export const pool = createPool({
  host: process.env.DB_HOST || "mysql-adoptaarbol.alwaysdata.net",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "431717",
  password: process.env.DB_PASSWORD || "Adopta123",
  database: process.env.DB_NAME || "adoptaarbol_database_db",
});
