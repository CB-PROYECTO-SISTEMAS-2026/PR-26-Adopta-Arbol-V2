# Carpeta de Comprobantes - Frontend

Esta carpeta contiene las imágenes de los comprobantes de compra que se muestran en el frontend.

## Ubicación:
`client/public/receipts/`

## Cómo funciona:
- Las imágenes se cargan directamente desde el frontend usando rutas relativas
- Ejemplo: `/receipts/2.png` se carga desde `client/public/receipts/2.png`
- No requiere configuración del servidor backend

## Formato de nombres:
- Los archivos deben nombrarse con el ID de la compra seguido de la extensión
- Ejemplo: `2.png`, `3.jpg`, `15.jpeg`, etc.

## Lógica actual (DINÁMICA):
- El sistema intenta cargar automáticamente la imagen para cualquier ID de compra
- Busca en orden: `{id}.png`, `{id}.jpg`, `{id}.jpeg`
- Si encuentra la imagen, la muestra; si no, muestra mensaje "No disponible"

## Para agregar más imágenes:
1. Coloca la imagen en esta carpeta con el nombre `{id}.{extensión}`
2. Extensiones soportadas: `.png`, `.jpg`, `.jpeg`
3. ¡No necesitas modificar código! Es completamente automático

## Ejemplos actuales:
- ID 1 → `1.jpg` ✅
- ID 2 → `2.png` ✅  
- ID 3 → `3.png` ✅
- ID 4 → `4.jpeg` ✅
- ID 5 → No existe ❌ (mostrará mensaje)

## Ventajas de esta implementación:
- ✅ Más simple que usar el backend
- ✅ Carga más rápida (sin peticiones HTTP adicionales)
- ✅ Fácil mantenimiento
- ✅ No requiere configuración de servidor
