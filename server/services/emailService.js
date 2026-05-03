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

  const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Credenciales de Acceso - AdoptaArbol</title>
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
            <div class="logo">AdoptaArbol</div>
            <h2>Bienvenido al sistema</h2>
          </div>
          
          <div class="content">
            <h3>Hola ${safeUserName},</h3>
            <p>Tu cuenta ha sido creada exitosamente. Estas son tus credenciales de acceso:</p>
            
            <div class="credentials">
              <h4>Credenciales de Acceso</h4>
              <p><strong>Usuario:</strong> ${safeUsername}</p>
              <p><strong>Contrasena:</strong> ${safePassword}</p>
              <p><strong>Correo:</strong> ${safeUserEmail}</p>
            </div>
            
            <p class="important">IMPORTANTE: Guarda estas credenciales en un lugar seguro.</p>
          </div>
          
          <div class="footer">
            <p>Este es un correo automatico, por favor no responder.</p>
          </div>
        </div>
      </body>
      </html>
    `;

  const text = [
    `Hola ${userName},`,
    "",
    "Tu cuenta ha sido creada exitosamente en AdoptaArbol.",
    "",
    "Credenciales de acceso:",
    `Usuario: ${username}`,
    `Contrasena: ${password}`,
    `Correo: ${userEmail}`,
    "",
    "Guarda estas credenciales en un lugar seguro.",
  ].join("\n");

  return { html, text };
};

// Configuración del transportador SMTP
const createTransporter = () => {
  const emailUser = normalizeEnv(process.env.EMAIL_USER);
  const emailPass = normalizeGmailAppPassword(process.env.EMAIL_PASS);

  if (!emailUser || !emailPass) {
    throw new Error(
      "Faltan EMAIL_USER o EMAIL_PASS en variables de entorno para SMTP",
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });
};

// Función para enviar credenciales de usuario
export const sendUserCredentials = async (
  userEmail,
  userName,
  username,
  password,
  options = {},
) => {
  try {
    const fromEmail = normalizeEnv(process.env.EMAIL_USER).toLowerCase();
    const toEmail = normalizeEnv(userEmail).toLowerCase();
    const plainTextOnly = options?.plainTextOnly === true;

    if (!EMAIL_REGEX.test(toEmail)) {
      return {
        success: false,
        error: "Correo de destinatario inválido",
        code: "INVALID_RECIPIENT",
      };
    }

    const { html: htmlTemplate, text: textTemplate } =
      buildCredentialsTemplates({
        userName,
        username,
        password,
        userEmail: toEmail,
      });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "🌳 Credenciales de Acceso - AdoptaÁrbol",
      html: htmlTemplate,
    };

    const maxAttempts = 3;
    let lastSmtpError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const transporter = createTransporter();
        const result = await transporter.sendMail(mailOptions);
        console.log(
          `✅ Correo enviado exitosamente (intento ${attempt}):`,
          result.messageId,
        );
        return { success: true, messageId: result.messageId, attempt };
      } catch (error) {
        const smtpError = formatEmailError(error);
        lastSmtpError = smtpError;
        const shouldRetry =
          attempt < maxAttempts && isTransientSmtpError(error);

        console.error(
          `❌ Error al enviar correo (intento ${attempt}/${maxAttempts}):`,
          smtpError,
        );

        if (!shouldRetry) {
          break;
        }

        await wait(attempt * 1000);
      }
    }

    // Fallback final: correo simple sin emoji en asunto para mejorar compatibilidad.
    try {
      const fallbackTransporter = createTransporter();
      const fallbackResult = await fallbackTransporter.sendMail({
        from: fromEmail,
        to: toEmail,
        subject: "Credenciales de Acceso - AdoptaArbol",
        text: textTemplate,
        ...(plainTextOnly ? {} : { html: htmlTemplate }),
      });

      console.log(
        "✅ Correo enviado exitosamente (fallback):",
        fallbackResult.messageId,
      );
      return {
        success: true,
        messageId: fallbackResult.messageId,
        attempt: "fallback",
      };
    } catch (fallbackError) {
      const fallbackSmtpError = formatEmailError(fallbackError);
      console.error("❌ Error en envío fallback:", fallbackSmtpError);

      return {
        success: false,
        error:
          fallbackSmtpError.message ||
          lastSmtpError?.message ||
          "No fue posible enviar el correo después de varios intentos",
        code:
          fallbackSmtpError.code ||
          lastSmtpError?.code ||
          "SMTP_RETRY_EXHAUSTED",
        responseCode:
          fallbackSmtpError.responseCode || lastSmtpError?.responseCode,
      };
    }
  } catch (error) {
    const smtpError = formatEmailError(error);
    console.error("❌ Error al enviar correo:", smtpError);
    return {
      success: false,
      error: smtpError.message,
      code: smtpError.code,
      responseCode: smtpError.responseCode,
    };
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
