[← Volver al README principal](../../../README.md)

# Revisión del sprint

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu
**Versión:** V_1_0_3

## Historias de Usuario completadas en este Sprint

- **ENB-05 / Despliegue y operatividad productiva:** backend FastAPI y frontend React/Vite desplegados en proyectos independientes de Vercel. El redeploy de producción del backend quedó en estado Ready. Evidencia comprobada el 2026-11-17: `GET /` y `GET /docs` responden 200; `GET /openapi.json` responde 200; el login con un correo válido no registrado responde 401; y desde el origen del frontend Vercel el navegador puede leer respuestas 401/422 de la API. Dominios: `https://distrir-pido-backend.vercel.app` y `https://distrir-pido-frontend.vercel.app`.
- **ENB-06 / Automatización del ciclo de entrega:** se añadieron flujos independientes de CI, pruebas y despliegue. El CI de GitHub Actions pasó para `8a1be2e` (run 44202217170). La ejecución Playwright en `ubuntu-24.04` instaló navegadores, pero falló al importar `@playwright/test`; se añadió la dependencia fija `1.55.0` al manifiesto y lockfile y queda pendiente la nueva ejecución. El despliegue de Actions falló porque falta el secreto `VERCEL_TOKEN` (run 44202217070). La publicación de producción documentada se hizo desde Vercel, no desde ese workflow.
- **RF-004 / Cierre de calidad de pedidos:** la interfaz y API mantienen validación de demanda y ventanas horarias. Evidencia técnica: `src/backend/app/schemas.py`, `src/backend/tests/test_customers.py` y `src/frontend/src/components/OrdersView.jsx`.
- **Calidad automatizada del incremento:** suites unitarias/integración locales aprobadas: backend 172/172 y frontend 89/89; build frontend aprobado. La suite Playwright está implementada, pero todavía no hay una ejecución E2E aprobada ni reporte HTML. Evidencia: `src/backend/tests/`, `src/frontend/src/*.test.jsx`, `src/frontend/e2e/smoke.spec.js` y `src/frontend/playwright.config.js`.

Se realizó una verificación técnica del entorno de producción el 2026-11-17. La interfaz pública muestra el formulario de inicio de sesión; la API devuelve el estado esperado para la raíz, documentación, OpenAPI, validación de login y acceso no autenticado a recursos protegidos. Esta comprobación no equivale a una demostración de aceptación con stakeholders ni valida credenciales reales, CRUD autenticado o flujos completos de rutas y flota.

El 2026-11-17 se ejecutaron además 30 solicitudes secuenciales por cada uno de tres endpoints públicos/negativos desde un equipo local: raíz, OpenAPI y clientes sin autenticación. Los tiempos p95 locales fueron 958.3 ms, 907.0 ms y 750.4 ms, respectivamente; por tanto, no se alcanza el objetivo de laboratorio de 500 ms p95. Al no capturarse región/red externa ni un token válido, son datos indicativos y el endpoint de clientes mide el rechazo 401, no una operación autenticada. No se completaron los 60 sondeos de disponibilidad.

Corrección: sí se completaron 20 mediciones consecutivas de FCP/LCP para la pantalla pública de inicio de sesión. El p75 fue 436 ms para FCP y 468 ms para LCP. La muestra no incluye las demás páginas autenticadas ni el protocolo de cinco calentamientos, y no se registró la región/viewport del navegador; por ello es evidencia parcial, no aceptación completa del objetivo por página.

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
- Repetir y completar las mediciones FCP/LCP por página conforme al protocolo (cinco calentamientos más 20 muestras, entorno/viewport documentados), cubrir las páginas autenticadas y repetir API desde runner externo; incluir el optimizador con carga explícita.
- Completar los 60 sondeos de disponibilidad espaciados un minuto y reportar todas las mediciones y fallos.
- Obtener al menos cinco respuestas SUS reales y anónimas de usuarios finales o stakeholders.
- Configurar en GitHub Actions `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_BACKEND_PROJECT_ID` y `VERCEL_FRONTEND_PROJECT_ID`; volver a ejecutar y comprobar el workflow de despliegue.
- Reejecutar Playwright en `ubuntu-24.04`; configurar `PLAYWRIGHT_BASE_URL`, `E2E_EMAIL` y `E2E_PASSWORD` para que también se valide el flujo autenticado.
- Completar 20 mediciones de FCP/LCP por página, repetir las mediciones de API desde un runner externo documentado e incluir el endpoint de optimización con carga explícita.
- Completar los 60 sondeos de disponibilidad a intervalos de un minuto.
- Obtener respuestas SUS de al menos cinco participantes reales.
- Crear una cuenta de prueba de forma segura, ejecutar flujos autenticados de pedidos, flota y optimización y revisar la conservación de datos locales en PostgreSQL.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Se crea la revisión del Sprint 4 con pendientes de validación explícitos. |
| 1.0.1 | 2026-11-17 | Se agrega evidencia comprobada del despliegue de producción y de las verificaciones HTTP/CORS; se mantienen pendientes las pruebas de aceptación y mediciones requeridas. |
| 1.0.2 | 2026-11-17 | Se agregan resultados reales de pruebas locales/API y estados de GitHub Actions; se registra la corrección del runner Playwright y los pendientes restantes. |
| 1.0.3 | 2026-11-17 | Se incorporan 20 muestras FCP/LCP de la pantalla pública y se registra el bloqueo E2E por dependencia ausente, ya añadida al manifiesto y lockfile. |
