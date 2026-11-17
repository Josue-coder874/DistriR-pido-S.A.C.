[← Volver al README principal](../../../README.md)

# Análisis Playwright

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_0_0
**Fecha del informe:** 2026-11-17

## Alcance y arquitectura

Las pruebas se encuentran en `src/frontend/e2e/`, con configuración centralizada en `src/frontend/playwright.config.js`. El runner ejecuta Chromium, Firefox y WebKit y genera HTML, trazas, capturas y videos solo para artefactos fallidos o conservados según la configuración.

El workflow `.github/workflows/tests.yml` instala los tres navegadores, ejecuta las pruebas y conserva `playwright-report/` y `test-results/` como artefactos. El workflow `.github/workflows/ci.yml` conserva las verificaciones unitarias y el build; `.github/workflows/deploy-production.yml` publica backend y frontend después de un push a `main`.

## Configuración del entorno

- Sistema: GitHub Actions Ubuntu latest.
- Navegadores: Chromium, Firefox y WebKit, con versiones fijadas por la versión instalada de `@playwright/test`.
- Viewport base: Desktop Chrome/Firefox/Safari configurados por Playwright.
- Variable `PLAYWRIGHT_BASE_URL`: URL HTTPS del frontend desplegado.
- Variables privadas: `E2E_EMAIL` y `E2E_PASSWORD`, inyectadas desde GitHub Secrets.
- Commit, navegador, viewport de medición, región y caché deben quedar visibles en el registro de cada ejecución.
- Sin `PLAYWRIGHT_BASE_URL`, el runner levanta el build local con `npm run build && npm run preview`.

## Pruebas End-to-End

Casos implementados:

| Flujo | Caso | Resultado esperado |
|---|---|---|
| Autenticación | Renderizar inicio de sesión | Se muestran correo, contraseña y formulario |
| Autenticación negativa | Credenciales inválidas | Se muestra una alerta y no hay navegación a los módulos |
| Flujo principal | Login válido y navegación | Se habilita el planificador y se puede abrir Pedidos y Rutas |

Los casos usan datos fuera del repositorio para el acceso válido. Las pruebas negativas no registran contraseña en el reporte. El caso autenticado se omite si faltan las variables `E2E_EMAIL` y `E2E_PASSWORD`; una omisión no se contabiliza como aprobación inicial.

Ejecución reproducible exigida: usar el mismo commit y datos reinicializados, ejecutar cada flujo crítico tres veces en cada navegador y registrar casos aprobados al primer intento. Fórmula de tasa inicial:

`casos aprobados al primer intento / casos ejecutados × 100`

Estado al 2026-11-17: la suite está implementada, pero no existe todavía un reporte HTML real adjunto ni una ejecución aprobatoria contra ambos dominios productivos. No se afirma que el 100% haya sido alcanzado.

## Rendimiento de laboratorio

Antes de medir se deben fijar:

- Commit desplegado.
- Versiones de Chromium, Playwright y sistema operativo.
- Viewport 1365 × 768.
- Región del runner.
- Configuración de red y política de caché.
- URL exacta de cada página.
- Datos y carga documentados.
- Fecha y hora de inicio.
- Runner externo al servicio.

Para cada página se realizan cinco ejecuciones de calentamiento no incluidas y 20 ejecuciones medibles. Se registran todas las mediciones válidas y fallidas. TTFB, FCP y LCP se resumen mediante mediana y p75.

Para cada endpoint ordinario se realizan al menos 30 solicitudes secuenciales. La medición comienza al iniciar la solicitud y termina al recibir el cuerpo completo. Los resultados se resumen mediante p50 y p95. Los objetivos de laboratorio son p75 de LCP menor a 2.5 segundos y p95 de endpoints ordinarios menor a 500 ms.

El endpoint `/api/routes/optimize` debe medirse aparte con una carga identificada, por ejemplo 150 pedidos y 15 vehículos. Los tiempos de este escenario no se mezclan con los endpoints ordinarios.

Estado al 2026-11-17: no se han registrado mediciones reproducibles adicionales a la compilación local de Vite. Por tanto, no existen aún métricas reales para afirmar cumplimiento de los objetivos.

## Disponibilidad y resiliencia

Sondeo definido:

- Endpoint: `/`.
- Criterio: HTTP 2xx recibido dentro de 10 segundos.
- Runner: externo al servicio desplegado.
- Muestra: 60 sondeos, uno en t=0 y uno por minuto hasta t=59.
- Sin reintentos.

Disponibilidad observada:

`sondeos exitosos / 60 × 100`

El resultado debe registrar hora UTC, código HTTP, latencia, timeout y error. Esta muestra puntual no constituye SLA ni estima disponibilidad mensual.

Pruebas de resiliencia pendientes de ejecución:

- Respuesta HTTP 401 ante credenciales inválidas.
- Respuesta HTTP 422 ante datos inválidos.
- Respuesta HTTP 5xx controlada o simulada.
- Corte de red desde el navegador.
- Comportamiento observado al recuperar la conectividad.

## Evidencias y pendientes

Artefactos previstos:

- `playwright-report/`
- `test-results/`
- Captura de 60 sondeos.
- Registro CSV o JSON de latencias de página y API.
- Capturas de respuestas HTTP negativas y fallo de red.

Los artefactos no deben incluir usuarios, contraseñas, tokens ni URIs privadas. Las pruebas de laboratorio no equivalen a datos de campo ni por sí solas certifican Core Web Vitals.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Se incorpora la suite Playwright ejecutable, la configuración multi-navegador y el protocolo completo de medición, disponibilidad y reporte. |
