import { pool } from "./db.js";

async function testQR() {
  try {
    console.log("Probando conexión a BD...");
    
    // Verificar que existe el registro con ID 1
    const [rows] = await pool.query("SELECT * FROM qrcode WHERE id = 1");
    console.log("Registro qrcode ID 1:", rows);
    
    if (rows.length === 0) {
      console.log("Creando registro qrcode ID 1...");
      await pool.query(
        "INSERT INTO qrcode (id, url, expirationDate, status, userId) VALUES (1, '/qrcodes/1.png', NULL, 1, 1)"
      );
      console.log("Registro creado exitosamente");
    } else {
      console.log("Registro ya existe");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

testQR();
