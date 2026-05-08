# PRD — EvalPro (Sistema 360°)

## Stack
React (CRA + Tailwind) + FastAPI + MongoDB. Frontend mock-state para Job Profiles.

## Auth
JWT custom. PostHog en index.html con `recordBody:false / recordHeaders:false` (fix bug "Body has already been consumed"). AuthContext usa `response.clone().text()`.

## Credenciales
Ver `/app/memory/test_credentials.md`. Demo admin: `maria@empresa.com / maria123`.

## Implementado
- [DONE] Login + JWT + arreglo PostHog fetch interceptor.
- [DONE] Seed DB (`/app/backend/seed.py`).
- [DONE] Lista de Empleados estilo Sesame (filas horizontales, status dots, acentos de color).
- [DONE] Job Profiles V1 (`/perfiles-puesto`) — formulario completo con KPIs/OKRs en sub-form.
- [DONE — 2026-02-08] Job Profiles V2 (`/perfiles-puesto-v2`) — edición tipo Excel inline (celdas editables, autofocus en nueva fila, navegación con Tab, delete on hover). Sidebar con badge "V2". V1 intacto.

## Backlog
- [P1] Editor de texto enriquecido (TipTap recomendado) en "Responsabilidades y Funciones".
- [P2] Backend CRUD real para Job Profiles en MongoDB (V1 y V2 actualmente sólo state).
- [P2] Vincular perfil de puesto a empleado en su perfil.
- [P3] Exportar perfil a PDF.

## Archivos clave
- `/app/frontend/src/App.js` — routing + sidebar.
- `/app/frontend/src/pages/JobProfiles.jsx` — V1 (NO TOCAR sin pedir).
- `/app/frontend/src/pages/JobProfilesV2.jsx` — V2 Excel-style.
- `/app/frontend/src/contexts/AuthContext.jsx` — login resiliente.
- `/app/frontend/public/index.html` — PostHog config.
