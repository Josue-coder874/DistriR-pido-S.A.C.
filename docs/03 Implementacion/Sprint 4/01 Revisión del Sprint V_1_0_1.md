[← Volver al README principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu
**Versión:** V_1_0_1

## Historias de Usuario completadas en este Sprint

- **ENB-05 / Despliegue y operatividad productiva:** backend FastAPI y frontend React/Vite desplegados en proyectos independientes de Vercel. El redeploy de producción del backend quedó en estado Ready. Evidencia comprobada el 2026-11-17: `GET /` y `GET /docs` responden 200; `GET /openapi.json` responde 200; el login con un correo válido no registrado responde 401; y desde el origen del frontend Vercel el navegador puede leer respuestas 401/422 de la API. Dominios: `https://distrir-pido-backend.vercel.app` y `https://distrir-pido-frontend.vercel.app`.
- **ENB-06 / Automatización del ciclo de entrega:** se añadieron flujos independientes de CI, pruebas y despliegue en `.github/workflows/ci.yml`, `.github/workflows/tests.yml` y `.github/workflows/deploy-production.yml`. Evidencia técnica: archivos versionados en el repositorio.
- **RF-004 / Cierre de calidad de pedidos:** la interfaz y API mantienen validación de demanda y ventanas horarias. Evidencia técnica: `src/backend/app/schemas.py`, `src/backend/tests/test_customers.py` y `src/frontend/src/components/OrdersView.jsx`.
- **Calidad automatizada del incremento:** quedaron disponibles las suites unitarias y de integración de backend/frontend, análisis de cobertura, build de producción y reporte HTML de Playwright. Evidencia técnica: `src/backend/tests/`, `src/frontend/src/*.test.jsx`, `src/frontend/e2e/smoke.spec.js` y `src/frontend/playwright.config.js`.

Se realizó una verificación técnica del entorno de producción el 2026-11-17. La interfaz pública muestra el formulario de inicio de sesión; la API devuelve el estado esperado para la raíz, documentación, OpenAPI, validación de login y acceso no autenticado a recursos protegidos. Esta comprobación no equivale a una demostración de aceptación con stakeholders ni valida credenciales reales, CRUD autenticado o flujos completos de rutas y flota.

## Demostración del trabajo completado

La demo se prepara sobre la arquitectura separada del proyecto: FastAPI expuesto como API HTTPS y React/Vite como interfaz pública. Se verificó que el backend inicia con la configuración de producción y alcanza el esquema PostgreSQL esperado. No se usaron ni publicaron credenciales reales.

Funciones verificables en la demostración:

1. Inicio de sesión y restricciones por rol.
2. Consulta y creación de pedidos.
3. Consulta y gestión de la flota.
4. Optimización de rutas y visualización esquemática sobre OpenStreetMap.
5. Navegación entre Dashboard, Pedidos, Rutas y Flota.

No se ejecutó una demo de negocio autenticada con stakeholders. No se presentan datos locales como resultados productivos ni se afirman Core Web Vitals de campo.

## Pendientes

- Ejecutar la suite E2E tres veces por flujo en Chromium, Firefox y WebKit y adjuntar los reportes HTML reales.
- Completar 20 mediciones por página, 30 solicitudes secuenciales por endpoint y 60 sondeos de disponibilidad; reportar todas las mediciones y fallos.
- Obtener al menos cinco respuestas SUS reales y anónimas de usuarios finales o stakeholders.
- Configurar y ejecutar el workflow de despliegue de GitHub Actions con los secretos requeridos; el despliegue actual se hizo desde Vercel.
- Completar la migración de datos locales que deban conservarse a PostgreSQL y ejecutar pruebas autenticadas de pedidos, flota y optimizador en producción.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Se crea la revisión del Sprint 4 con pendientes de validación explícitos. |
| 1.0.1 | 2026-11-17 | Se agrega evidencia comprobada del despliegue de producción y de las verificaciones HTTP/CORS; se mantienen pendientes las pruebas de aceptación y mediciones requeridas. |
