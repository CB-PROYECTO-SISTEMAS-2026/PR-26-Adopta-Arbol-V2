# Estructura del Proyecto

## Objetivo

Esta organización separa claramente aplicacion, servidor, documentacion y utilidades de diagnostico.

## Esquema

```text
PR-26-Adopta-Arbol-V2/
|-- client/                  # Frontend React (Vite)
|   |-- src/
|   |   |-- api/             # Clientes HTTP por recurso
|   |   |-- components/
|   |   |   |-- admin/       # Barrel de componentes admin
|   |   |   |-- auth/        # Barrel de autenticacion
|   |   |   |-- irrigator/   # Barrel de flujo regador
|   |   |   |-- landing/     # Barrel de landing
|   |   |   |-- shared/      # Barrel de componentes compartidos
|   |   |-- context/         # Context providers
|   |   |-- pages/           # Vistas de pagina
|-- server/                  # API Express + DB
|   |-- controllers/         # Controladores (naming unificado *.controller.js)
|   |-- routes/              # Rutas de API
|   |-- services/            # Servicios (mail, etc.)
|   |-- migrations/          # SQL de migraciones
|-- docs/
|   |-- PROJECT_STRUCTURE.md # Guia de arquitectura y convenciones
|   |-- notes/
|   |   |-- theme/           # Notas de cambios visuales
|   |   |-- legacy/          # Documentacion historica
|   |-- ManualTecnico/       # Manual tecnico del proyecto
|-- scripts/
|   |-- diagnostics/         # Scripts de prueba y diagnostico
|-- public/                  # Assets estaticos compartidos
|-- README.md                # Guia principal de arranque
```

## Convenciones aplicadas

- Backend: archivos de controlador con patron singular `*.controller.js`.
- Frontend: imports organizados por dominio usando barrels en `components/*/index.js`.
- Raiz limpia: notas en `docs/` y scripts operativos en `scripts/`.
