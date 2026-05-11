import "dotenv/config";
import nodemailer from "nodemailer";

// Debug: mostrar variables de entorno
console.log("📧 EMAIL CONFIG DEBUG:");
console.log("   EMAIL_USER:", process.env.EMAIL_USER ? "✓ Configurado" : "✗ No configurado");
console.log("   EMAIL_PASS:", process.env.EMAIL_PASS ? "✓ Configurado" : "✗ No configurado");
console.log("   EMAIL_USER value:", process.env.EMAIL_USER);
console.log("   EMAIL_PASS value:", process.env.EMAIL_PASS);

// Configuración del transportador SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Función para enviar credenciales de usuario
export const sendUserCredentials = async (
  userEmail,
  userName,
  username,
  password
) => {
  try {
    // Verificar si las credenciales de email están configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn(
        "⚠️ EMAIL_USER o EMAIL_PASS no están configurados en .env. Email no será enviado."
      );
      console.log("📋 Credenciales de usuario para registrar manualmente:");
      console.log(`   Usuario: ${username}`);
      console.log(`   Contraseña: ${password}`);
      console.log(`   Email: ${userEmail}`);
      return {
        success: true,
        messageId: "SKIPPED_NO_CONFIG",
        message: "Email deshabilitado: configurar EMAIL_USER y EMAIL_PASS en .env"
      };
    }

    const transporter = createTransporter();

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Credenciales de Acceso - AdoptaÁrbol</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background-color: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          .logo { font-size: 24px; font-weight: bold; }
          .important { color: #e74c3c; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🌳 AdoptaÁrbol</div>
            <h2>¡Bienvenido al sistema!</h2>
          </div>
          
          <div class="content">
            <h3>Hola ${userName},</h3>
            <p>Tu cuenta ha sido creada exitosamente en nuestro sistema AdoptaÁrbol. A continuación encontrarás tus credenciales de acceso:</p>
            
            <div class="credentials">
              <h4>📧 Credenciales de Acceso</h4>
              <p><strong>Usuario:</strong> ${username}</p>
              <p><strong>Contraseña:</strong> ${password}</p>
              <p><strong>Correo:</strong> ${userEmail}</p>
            </div>
            
            <p class="important">⚠️ IMPORTANTE: Guarda estas credenciales en un lugar seguro. Te recomendamos cambiar la contraseña en tu primer inicio de sesión.</p>
            
            <p>Puedes acceder al sistema usando estas credenciales. Si tienes alguna duda o problema, no dudes en contactar al administrador.</p>
            
            <p>¡Gracias por ser parte de AdoptaÁrbol! 🌱</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automático, por favor no responder.</p>
            <p>© 2025 AdoptaÁrbol - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🌳 Credenciales de Acceso - AdoptaÁrbol",
      html: htmlTemplate,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Correo enviado exitosamente:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    return { success: false, error: error.message };
  }
};

// Función de prueba para verificar conexión SMTP
export const testEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Conexión SMTP verificada correctamente");
    return true;
  } catch (error) {
    console.error("❌ Error en conexión SMTP:", error);
    return false;
  }
};
