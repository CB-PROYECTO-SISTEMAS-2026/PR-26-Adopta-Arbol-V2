import express from "express";
import cors from "cors";
import { PORT, NODE_ENV, FRONTEND_URL } from "./config.js";
import indexRoutes from "./routes/index.routes.js";
import userRoutes from "./routes/user.routes.js";
import treeRoutes from "./routes/tree.routes.js";
import adoptionRoutes from "./routes/adoption.routes.js";
import redemptionRoutes from "./routes/redemption.routes.js";
import purchaseRoutes from "./routes/purchase.routes.js";
import irrigationRoutes from "./routes/irrigation.routes.js";
import creditRoutes from "./routes/credit.routes.js";
import tecRoutes from "./routes/tec.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configurar CORS
app.use(cors({
  origin: NODE_ENV === "production" ? FRONTEND_URL : "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Routes
app.use(indexRoutes);
app.use("/api", userRoutes);
app.use("/api", treeRoutes);
app.use("/api", irrigationRoutes);
app.use("/api", adoptionRoutes);
app.use("/api", redemptionRoutes);
app.use("/api", purchaseRoutes);
app.use("/api", creditRoutes);
app.use("/api", tecRoutes);
app.use("/api", categoryRoutes);
app.use("/api", notificationRoutes);

// Servir archivos estáticos desde las carpetas public
app.use("/qrcodes", express.static(path.join(__dirname, "..", "public", "qrcodes")));
app.use("/receipts", express.static(path.join(__dirname, "..", "client", "public", "receipts")));
app.use("/Tree", express.static(path.join(__dirname, "..", "public", "Tree")));
app.use("/evidence", express.static(path.join(__dirname, "..", "public", "evidence")));
app.use("/", express.static(path.join(__dirname, "..", "client", "public")));

// En producción, servir el frontend construido
if (NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "..", "client", "dist");
  app.use(express.static(clientBuildPath));
  
  // Middleware para servir index.html en todas las rutas que no sean API o archivos estáticos
  // Esto es necesario para el routing del SPA (Single Page Application)
  app.use((req, res, next) => {
    // Si la ruta es para la API, continuar con el siguiente middleware
    if (req.path.startsWith("/api")) {
      return next();
    }
    // Si es un archivo estático (tiene extensión), continuar
    if (req.path.includes(".") && !req.path.endsWith("/")) {
      return next();
    }
    // Para todas las demás rutas, servir el index.html del frontend
    res.sendFile(path.join(clientBuildPath, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});
