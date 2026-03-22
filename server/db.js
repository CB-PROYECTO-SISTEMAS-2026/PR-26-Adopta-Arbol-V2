import { createPool } from "mysql2/promise";

// Definición del pool de conexiones
export const pool = createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "MyBelle123_",
  database: process.env.DB_NAME || "adoptaarbol_database_db",
});
