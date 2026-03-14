# PR-26-Adopta-Arbol-V2

## Configuración del entorno local

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18 o superior
- Una base de datos local (PostgreSQL, MySQL u otra compatible)

### Primeros pasos

1. **Clona el repositorio**

   ```bash
   git clone https://github.com/CB-PROYECTO-SISTEMAS-2026/PR-26-Adopta-Arbol-V2.git
   cd PR-26-Adopta-Arbol-V2
   ```

2. **Configura las variables de entorno**

   Copia el archivo de ejemplo y completa tus credenciales locales:

   ```bash
   cp .env.example .env
   ```

   Edita `.env` y reemplaza los valores de placeholder con los de tu base de datos local:

   | Variable      | Descripción                          | Ejemplo       |
   |---------------|--------------------------------------|---------------|
   | `DB_HOST`     | Host de la base de datos             | `localhost`   |
   | `DB_PORT`     | Puerto de la base de datos           | `5432`        |
   | `DB_USER`     | Usuario de la base de datos          | `postgres`    |
   | `DB_PASSWORD` | Contraseña de la base de datos       | `mi_clave`    |
   | `DB_NAME`     | Nombre de la base de datos           | `adopta_arbol`|
   | `PORT`        | Puerto del servidor backend          | `3000`        |
   | `JWT_SECRET`  | Clave secreta para tokens JWT (mínimo 32 chars) | `openssl rand -hex 32` |

3. **Instala las dependencias del backend**

   ```bash
   npm install
   ```

4. **Instala las dependencias del frontend**

   ```bash
   cd client
   npm install
   cd ..
   ```

5. **Inicia el proyecto**

   - Backend (desde la raíz):

     ```bash
     npm run dev
     ```

   - Frontend (desde la carpeta `client`):

     ```bash
     cd client
     npm run dev
     ```

> **Nota:** El archivo `.env` está excluido del repositorio por `.gitignore`.  
> Nunca subas credenciales reales al repositorio.