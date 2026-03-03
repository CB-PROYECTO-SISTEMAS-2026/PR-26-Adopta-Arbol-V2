// Configuración de la API
// En desarrollo usa localhost, en producción usa la variable de entorno
const getApiUrl = () => {
  // Si estamos en producción y hay una variable de entorno definida, usarla
  if (import.meta.env.PROD && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Si estamos en desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return "http://localhost:4000/api";
  }
  // En producción sin variable, asumir que el backend está en el mismo dominio
  return "/api";
};

export const API_URL = getApiUrl();

// URL base para recursos estáticos (imágenes, etc.)
export const getStaticUrl = (path) => {
  if (!path) return "";
  
  // Si la ruta ya es una URL completa, devolverla tal cual
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  // En desarrollo, usar localhost
  if (import.meta.env.DEV) {
    return `http://localhost:4000${path}`;
  }
  
  // En producción, usar la ruta relativa (el backend sirve los archivos estáticos)
  return path;
};

