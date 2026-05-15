# PRD — EvalPro (Sistema 360°)

## Última solicitud (2026-05-15)
- **Problema original:** "Levanta el proyecto".
- **Decisión tomada:** usar `supervisor` para arrancar servicios (backend/frontend) y validar salud local + URL preview.
- **Resultado implementado:** backend y frontend levantados, con verificación HTTP exitosa.

## Stack
React (CRA + Tailwind) + FastAPI + MongoDB. Frontend mock-state para Job Profiles. PDF con `html2pdf.js`.

## Auth
JWT custom. PostHog en `index.html` con `recordBody:false / recordHeaders:false`. AuthContext usa `response.clone().text()`.

## Credenciales
Ver `/app/memory/test_credentials.md`. Demo admin: `maria@empresa.com / maria123`.

## Implementado
- [DONE] Login + JWT + arreglo PostHog fetch interceptor.
- [DONE] Seed DB (`/app/backend/seed.py`).
- [DONE] Lista de Empleados estilo Sesame.
- [DONE] Job Profiles V1 (`/perfiles-puesto`) — formulario con KPIs/OKRs sub-form.
- [DONE — 2026-02-08] Job Profiles V2 (`/perfiles-puesto-v2`) — edición tipo Excel inline.
- [DONE — 2026-02-08] **Configuración / Valores de Empresa** (`/configuracion`):
  - Página admin con CRUD de valores (añadir, editar, eliminar, reordenar arriba/abajo, restaurar default).
  - Persistencia en `localStorage` (`evalpro:companyValues`).
  - Compartido entre V1 y V2 vía `CompanyValuesProvider`.
- [DONE — 2026-02-08] Default todos los valores seleccionados al crear nuevo perfil (V1 y V2).
- [DONE — 2026-02-08] Botón **"Descargar PDF"** en formulario de edición (V1 y V2):
  - Genera PDF tipo plantilla original (encabezado oscuro, secciones numeradas, tablas con colores Ideal/Esperado/Intermedio/Insuficiente, OKRs, valores como pills).
  - Sin botones ni cromo de UI en el PDF.
  - Filename: `Perfil_<Puesto>.pdf`.
  - Usa `html2pdf.js` (jspdf + html2canvas).

## Backlog
- [P0] Revisar causa intermitente de reinicio de frontend (`craco: not found`) para evitar caídas en arranque automático.
- [P1] Editor de texto enriquecido (TipTap) en "Responsabilidades y Funciones".
- [P2] Backend CRUD real para Job Profiles en MongoDB (V1 y V2 todavía state local).
- [P2] Persistir valores de empresa en backend (hoy en localStorage).
- [P2] Vincular perfil de puesto a empleado.
- [P3] Botón "Duplicar perfil" en catálogo.

## Archivos clave
- `/app/frontend/src/App.js` — routing + sidebar + `CompanyValuesProvider` envoltorio.
- `/app/frontend/src/pages/JobProfiles.jsx` — V1.
- `/app/frontend/src/pages/JobProfilesV2.jsx` — V2 Excel-style.
- `/app/frontend/src/pages/CompanySettings.jsx` — admin de valores.
- `/app/frontend/src/contexts/CompanyValuesContext.jsx` — contexto + localStorage.
- `/app/frontend/src/utils/jobProfilePdf.js` — generación PDF.
