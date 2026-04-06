import "dotenv/config";

export const PORT = process.env.PORT || 4000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";
