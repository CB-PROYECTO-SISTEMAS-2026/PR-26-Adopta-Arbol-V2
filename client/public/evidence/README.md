# Carpeta de Evidencias de Riego - Frontend

Esta carpeta contiene las imágenes de evidencia de riegos que se muestran en el modal de detalles de irrigation.

## Ubicación:
`client/public/evidence/`

## Cómo funciona:
- Las imágenes se cargan directamente desde el frontend usando rutas relativas
- Ejemplo: `/evidence/2.png` se carga desde `client/public/evidence/2.png`
- No requiere configuración del servidor backend

## Formato de nombres:
- Los archivos deben nombrarse con el ID del riego seguido de la extensión
- Ejemplo: `2.png`, `3.jpg`, `15.jpeg`, etc.

## Lógica actual (DINÁMICA):
- El sistema intenta cargar automáticamente la imagen para cualquier ID de riego
- Busca en orden: `{id}.png`, `{id}.jpg`, `{id}.jpeg`
- Si encuentra la imagen, la muestra; si no, muestra mensaje "No disponible"

## Para agregar más imágenes:
1. Coloca la imagen en esta carpeta con el nombre `{id}.{extensión}`
2. Extensiones soportadas: `.png`, `.jpg`, `.jpeg`
3. ¡No necesitas modificar código! Es completamente automático

## Ejemplos actuales:
- ID 2 → `2.png` ✅ (según base de datos mostrada)

## Integración:
- Se muestra en el modal de ViewDetailsModal cuando `type="irrigation"`
- Aparece en la sección "Evidencia" junto con el texto descriptivo
- Incluye estados de carga y manejo de errores

## Ventajas de esta implementación:
- ✅ Más simple que usar el backend
- ✅ Carga más rápida (sin peticiones HTTP adicionales)
- ✅ Fácil mantenimiento
- ✅ Estados visuales (loading, éxito, error)
- ✅ Soporte para múltiples formatos de imagen
