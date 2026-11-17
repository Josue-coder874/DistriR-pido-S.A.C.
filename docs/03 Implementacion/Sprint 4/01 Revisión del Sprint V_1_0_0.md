[← Volver al README principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu

## Historias de Usuario completadas en este Sprint

- **ENB-05 / Despliegue y operatividad productiva:** se prepararon dos proyectos independientes de Vercel, uno para FastAPI y otro para React/Vite, y se configuró la conexión del repositorio principal. Evidencia técnica: `src/backend/README.md`, `src/frontend/README.md` y la configuración de despliegue del proyecto.
- **ENB-06 / Automatización del ciclo de entrega:** se añadieron flujos independientes de CI, pruebas y despliegue en `.github/workflows/ci.yml`, `.github/workflows/tests.yml` y `.github/workflows/deploy-production.yml`. Evidencia técnica: archivos versionados en el repositorio.
- **RF-004 / Cierre de calidad de pedidos:** la interfaz y API mantienen validación de demanda y ventanas horarias. Evidencia técnica: `src/backend/app/schemas.py`, `src/backend/tests/test_customers.py` y `src/frontend/src/components/OrdersView.jsx`.
- **Calidad automatizada del incremento:** quedaron disponibles las suites unitarias y de integración de backend/frontend, análisis de cobertura, build de producción y reporte HTML de Playwright. Evidencia técnica: `src/backend/tests/`, `src/frontend/src/*.test.jsx`, `src/frontend/e2e/smoke.spec.js` y `src/frontend/playwright.config.js`.

La demostración final se ejecuta sobre el entorno desplegado de Vercel cuando el despliegue de producción está disponible. Debe exhibirse autenticación, dashboard, pedidos, rutas y flota; no se contabiliza como aprobada una demostración mientras el dominio correspondiente siga respondiendo errores de ejecución.

## Demostración del trabajo completado

Se realizó la preparación de la demo sobre la arquitectura separada del proyecto: FastAPI expuesto como API HTTPS y React/Vite como interfaz pública. El entorno incluye variables privadas de producción, PostgreSQL/Supabase y credenciales para iniciar sesión fuera del repositorio.

Funciones verificables en la demostración:

1. Inicio de sesión y restricciones por rol.
2. Consulta y creación de pedidos.
3. Consulta y gestión de la flota.
4. Optimización de rutas y visualización esquemática sobre OpenStreetMap.
5. Navegación entre Dashboard, Pedidos, Rutas y Flota.

La demo no debe presentar datos locales como resultados reales de un entorno externo ni afirmar Core Web Vitals de campo sin mediciones de usuarios reales.

## Pendientes

- Completar y registrar 20 mediciones válidas de FCP y LCP por página junto a las 30 solicitudes secuenciales exigidas para cada endpoint.
- Ejecutar los 60 sondeos temporizados desde un runner externo y adjuntar el reporte HTML de Playwright.
- Obtener al menos cinco respuestas reales y anónimas al SUS desde usuarios finales o stakeholders que usen la misma versión desplegada.
- Verificar el dominio final del backend y registrar su dominio HTTPS en `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS`.
- Configurar los seis secretos de CI de Vercel y Playwright: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_BACKEND_PROJECT_ID`, `VERCEL_FRONTEND_PROJECT_ID`, `PLAYWRIGHT_BASE_URL`, `E2E_EMAIL` y `E2E_PASSWORD`.
- Completar la migración de datos reales a PostgreSQL y revisar las pruebas del optimizador en el entorno productivo.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Cierre técnico y metodológico del Sprint 4; evidencia enlazada a código y despliegue sin marcar como completados los resultados aún pendientes de ejecución. |
