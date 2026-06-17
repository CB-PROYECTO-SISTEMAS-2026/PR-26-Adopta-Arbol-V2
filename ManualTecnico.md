# Manual Técnico del Proyecto

## 1. Integrantes – Roles

- Luis Eduardo Pantoja Fernandez – Team Leader
- Nayara Kate Hurtado Barja – Git Master

## 2. Introducción

Este proyecto es una plataforma para gestionar adopciones de árboles, seguimiento de riegos, pagos y notificaciones. Permite a usuarios registrarse como adoptantes, regadores o técnicos, y administrar tareas relacionadas con el ciclo de vida del árbol adoptado.

## 3. Descripción / objetivo del proyecto

El objetivo es implementar un sistema web completo que soporte:
- registro y autenticación de usuarios
- gestión de adopciones
- seguimiento de riegos
- administración de pagos y redenciones
- panel administrativo para reportes y gestión de datos

La aplicación consta de un frontend en Vite/React y un backend en Node.js con una base de datos MySQL.

## 4. Link al Video ilustrativo

Video ilustrativo:
https://drive.google.com/file/d/1_i3QyPJw1Ag_Xmheze9TUllXdnJ7fl_G/view

## 5. Listado de los Requisitos Funcionales del Sistema

- Registro e inicio de sesión para usuarios
- Roles diferenciados: administrador, adoptante, regador, técnico
- Adopción de árboles y visualización de estado
- Control de riegos y registro de eventos de riego
- Compra de créditos y gestión de pagos
- Generación y descarga de códigos QR
- Panel administrativo para administración de categorías, árboles, pagos y redenciones
- Envío de notificaciones
- Seguridad de rutas y control de acceso por rol

## 6. Arquitectura del software

- Frontend
  - `client/`
  - Vite + React
  - Consumo de API REST del backend
- Backend
  - `server/`
  - Node.js + Express
  - Rutas en `server/routes`
  - Controladores en `server/controllers`
  - Servicios en `server/services`
- Base de datos
  - MySQL
  - Tablas definidas en `server/migrations`

Interacciones:
- El frontend llama a `BACKEND_URL`
- El backend usa variables de entorno para conectar a la base de datos

Patrones usados:
- MVC simplificado en el backend
- Separación de responsabilidades por capas: rutas, controladores, servicios
- Uso de archivos de configuración y modularidad

## 7. Base de datos

- Motor: MySQL
- Host: `mysql-jokaly.alwaysdata.net`
- Puerto: `3306`
- Usuario: `jokaly_user`
- Contraseña: `#Edu1210`
- Base de datos: `jokaly_adopttreev2`

Variables de entorno:
```
DB_HOST=mysql-jokaly.alwaysdata.net
DB_PORT=3306
DB_USER=jokaly_user
DB_PASSWORD="#Edu1210"
DB_NAME=jokaly_adopttreev2
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```

## 8. Diagrama completo y actual

El diagrama completo debe incluir:
- entidades principales: usuarios, árboles, adopciones, riegos, pagos, redenciones, categorías, notificaciones
- relaciones entre tablas
- cardinalidades

Incluir el diagrama actualizado como imagen o archivo dentro del repositorio.

## 9. En el GIT una carpeta con la base de datos

Carpeta recomendada: `server/migrations/`
- Incluir scripts SQL de creación de tablas y datos de ejemplo
- Incluir también un README breve dentro de la carpeta de base de datos explicando el orden de ejecución

## 10. Script simple

Ejemplo de script SQL para creación e inserción básica:

```sql
CREATE DATABASE IF NOT EXISTS jokaly_adopttreev2;
USE jokaly_adopttreev2;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(30) NOT NULL,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS trees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  category_id INT,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO users (username, password, role, email)
VALUES
('Alvaro_Fern', 'Alvaro@2025', 'Admin', 'alvaro@example.com'),
('juan_gl', 'Juangl#2025', 'adoptante', 'juan@example.com'),
('carlos_mr', 'Carloa$2025', 'regador', 'carlos@example.com'),
('maria_rf', 'Maria!2025', 'tecnico', 'maria@example.com');
```

## 11. Listado de Roles más sus credenciales

- `Alvaro_Fern` / `Alvaro@2025` → Admin
- `juan_gl` / `Juangl#2025` → Adoptante
- `carlos_mr` / `Carloa$2025` → Regador
- `maria_rf` / `Maria!2025` → Técnico

## 12. Requisitos del sistema

### Requerimientos de Hardware (cliente)
- Procesador moderno de 2 núcleos
- 4 GB RAM
- 2 GB de espacio libre en disco
- Conexión a Internet

### Requerimientos de Software (cliente)
- Navegador moderno: Chrome, Edge, Firefox
- Node.js para desarrollo local (versión recomendada 18+)
- npm / yarn

### Requerimientos de Hardware (server / hosting / BD)
- 1 CPU virtual / 2 CPU
- 4 GB RAM mínimo
- 10 GB de disco
- Conexión estable a Internet

### Requerimientos de Software (server / hosting / BD)
- Node.js 18+
- MySQL 8 o compatible
- Git
- Servidor web / hosting que permita Node.js
- Opcional: Docker

## 13. Instalación y configuración

1. Clonar repositorio:
   - `git clone <URL del repositorio>`
2. Instalar frontend:
   - `cd client`
   - `npm install`
3. Instalar backend:
   - `cd ../server`
   - `npm install`
4. Configurar `.env` en `server/` con:
```
DB_HOST=mysql-jokaly.alwaysdata.net
DB_PORT=3306
DB_USER=jokaly_user
DB_PASSWORD="#Edu1210"
DB_NAME=jokaly_adopttreev2
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:4000
```
5. Iniciar backend:
   - `npm run dev` o `node index.js`
6. Iniciar frontend:
   - `cd ../client`
   - `npm run dev`

## 14. Procedimiento de hosteado / hosting (configuración)

### Sitio Web
- Deploy del frontend estático en Vercel, Netlify o similar
- Configurar `FRONTEND_URL` apuntando al dominio de producción

### Base de datos
- Usar MySQL alojado en servidor o servicio cloud
- Configurar acceso con `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- Asegurar acceso remoto si el servidor backend lo necesita

### API / servicios Web
- Deploy del backend Node.js en servidor o en plataforma con soporte Node
- Configurar variables de entorno en el entorno de hosting
- Verificar rutas `server/routes/*`

### Otros
- Si se usa Firebase u otros servicios, detallar configuración y credenciales
- En este proyecto no se utiliza Firebase actualmente

## 15. Detallado paso a paso de puesta en marcha en hosting

1. Crear servidor virtual o servicio Node/hosting.
2. Configurar MySQL y crear base de datos `jokaly_adopttreev2`.
3. Importar scripts SQL desde `server/migrations/`.
4. Configurar `.env` en backend con credenciales y URL correctas.
5. Desplegar backend.
6. Verificar que `BACKEND_URL` responde y devuelve las rutas esperadas.
7. Desplegar frontend apuntando al backend en `BACKEND_URL`.
8. Probar acceso con los usuarios listados.
9. Documentar credenciales de hosting si se requiere acceso a servidor/root BD.

## 16. GIT

- Rama principal: `main`
- Entrega final: código integrado en `main`
- Compilados o builds deben entregarse en las carpetas correspondientes
- Cada developer debe mantener ramas feature separadas
- Incluir en Git:
  - código fuente
  - scripts de base de datos
  - documentación técnica
  - manual técnico

## 17. Dockerizado del Backend y FrontEnd, Base de Datos

- Se recomienda crear:
  - `Dockerfile` para backend
  - `Dockerfile` o configuración para frontend
  - `docker-compose.yml` para orquestar backend, frontend y MySQL
- Debe permitir desplegar:
  - backend Node.js
  - frontend React
  - base de datos MySQL

## 18. Proceso de dockerizado, Configuración

1. Crear `Dockerfile` en backend con Node.js
2. Crear `Dockerfile` en frontend con build de Vite
3. Crear `docker-compose.yml` con servicios:
   - `backend`
   - `frontend`
   - `db`
4. Configurar variables de entorno en `docker-compose`
5. Ejecutar:
   - `docker-compose up --build`

## 19. Cómo hacer correr, Acceso credenciales

### Backend
- `cd server`
- `npm install`
- `npm run dev`

### Frontend
- `cd client`
- `npm install`
- `npm run dev`

### Base de datos
- Host: `mysql-jokaly.alwaysdata.net`
- Usuario: `jokaly_user`
- Contraseña: `#Edu1210`
- Base de datos: `jokaly_adopttreev2`

### Credenciales de roles
- Admin: `Alvaro_Fern` / `Alvaro@2025`
- Adoptante: `juan_gl` / `Juangl#2025`
- Regador: `carlos_mr` / `Carloa$2025`
- Técnico: `maria_rf` / `Maria!2025`

## 20. Personalización y configuración

- Cambiar variables de entorno según el entorno de despliegue
- Ajustar `FRONTEND_URL` y `BACKEND_URL` para producción
- Configurar credenciales de acceso y roles
- Adaptar categorías y árboles en la base de datos según necesidades

## 21. Seguridad

- No exponer credenciales en repositorio público
- Usar variables de entorno para datos sensibles
- Proteger rutas del backend con validación de roles
- Asegurar el acceso a la base de datos mediante contraseñas seguras
- Validar entradas del usuario en frontend y backend

## 22. Glosario de términos

- Admin: usuario con permisos de gestión completa
- Adoptante: usuario que adopta árboles
- Regador: usuario encargado de registrar riegos
- Técnico: usuario de soporte técnico
- Frontend: parte visual de la aplicación
- Backend: API que gestiona la lógica y datos
- MySQL: motor de base de datos relacional
- Docker: contenedores para empaquetar aplicaciones

## 23. Referencias y recursos adicionales

- Documentación de React
- Documentación de Vite
- Documentación de Node.js
- Documentación de Express
- Documentación de MySQL
- GitHub del proyecto

## 24. Herramientas de Implementación

- Lenguajes de programación:
  - JavaScript
- Frameworks:
  - React
  - Vite
  - Express
- APIs de terceros:
  - Email/Notificaciones (según configuración en `server/services/emailService.js`)

## 25. Bibliografía

- Documentación oficial de React
- Documentación oficial de Vite
- Documentación oficial de Node.js
- Documentación oficial de Express
- Documentación oficial de MySQL
- Guías de buenas prácticas de GitHub
