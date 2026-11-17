[← Volver al README principal](../../../README.md)

# Análisis Playwright

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_0_2
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

Estado al 2026-11-17: la ejecución GitHub Actions 44201095586 falló durante la instalación de los navegadores. Playwright 1.55 no soporta el runner `ubuntu-latest` resuelto como Ubuntu 26.04. Se cambió el runner del workflow a `ubuntu-24.04`; falta que la nueva ejecución termine para confirmar la suite. No hay reporte HTML aprobado ni tasa E2E verificada.

Las pruebas unitarias/integración del backend local pasaron 172/172 con Python 3.12; las pruebas unitarias frontend pasaron 89/89 y `npm run build` finalizó correctamente. Vitest se configuró para descubrir solamente `src/**/*.test.{js,jsx}`, evitando importar las pruebas Playwright como pruebas unitarias.

### Verificación de humo de producción (no sustituye la suite E2E)

El 2026-11-17 se comprobó el despliegue de Vercel contra el commit `a19e7ce`:

| Solicitud | Resultado observado | Interpretación |
|---|---|---|
| `GET https://distrir-pido-backend.vercel.app/` | HTTP 200; JSON de estado `ok` | Aplicación FastAPI inicia |
| `GET /docs` | HTTP 200; HTML de Swagger UI | Documentación de API disponible |
| `GET /openapi.json` | HTTP 200; esquema OpenAPI 3.1 | Esquema de endpoints disponible |
| `GET /api/customers` sin token | HTTP 401 | Protección de autenticación activa |
| `POST /api/auth/login` con formato de correo inválido | HTTP 422 | Validación de entrada activa |
| `POST /api/auth/login` con correo válido aleatorio no registrado | HTTP 401 | La ruta de login procesa la solicitud y devuelve rechazo esperado; no se usó una cuenta real |

Desde una página servida en `https://distrir-pido-frontend.vercel.app`, el navegador pudo leer las respuestas 422 y 401 de la API. Esto confirma CORS para ese origen en esas solicitudes. No valida credenciales válidas ni los flujos funcionales autenticados. Las pruebas fueron sondeos puntuales; no constituyen una serie de latencia ni de disponibilidad.

### Medición secuencial de API

El 2026-11-17 se realizaron 30 solicitudes secuenciales por endpoint, desde un equipo local Windows con Python 3.12 y `urllib`. Se midió tiempo total de cada petición y lectura del cuerpo; no se registró la región del cliente ni se usó un runner externo. Los percentiles se calcularon sobre las 30 muestras sin descartar resultados.

| Endpoint | Respuestas | p50 | p95 | Interpretación |
|---|---:|---:|---:|---|
| `GET /` | 30 × HTTP 200 | 557.5 ms | 958.3 ms | Servicio responde; excede objetivo indicativo p95 < 500 ms |
| `GET /openapi.json` | 30 × HTTP 200 | 593.9 ms | 907.0 ms | Esquema disponible; excede objetivo indicativo p95 < 500 ms |
| `GET /api/customers` sin token | 30 × HTTP 401 | 554.9 ms | 750.4 ms | Protección activa; mide solo el rechazo no autenticado, no el tiempo de consulta autenticada |

Estos resultados son mediciones preliminares desde una única conexión de cliente/red no caracterizada; no sustituyen el protocolo reproducible desde runner externo y no certifican el rendimiento de todos los endpoints. No se midió `/api/routes/optimize` porque no había sesión autenticada ni carga de prueba.

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

Estado al 2026-11-17: existen las muestras API preliminares descritas arriba, pero siguen pendientes las 20 muestras por página de FCP/LCP y una serie repetible desde runner externo. Los percentiles observados de API no cumplen el objetivo de laboratorio p95 < 500 ms y deben confirmarse en el entorno de medición especificado.

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

- Respuesta HTTP 5xx controlada o simulada.
- Corte de red desde el navegador.
- Comportamiento observado al recuperar la conectividad.

La respuesta 401 por falta de autenticación y el 422 de validación documentados arriba son comprobaciones puntuales, no reemplazan la matriz de resiliencia ni la evidencia de fallo de red.

No se completaron los 60 sondeos espaciados un minuto: esa ventana observacional de una hora queda pendiente.

## Evidencias y pendientes

Artefactos previstos:

- `playwright-report/`
- `test-results/`
- Captura de 60 sondeos.
- Registro CSV o JSON de latencias de página y API.
- Capturas de respuestas HTTP negativas y fallo de red.

Estado de CI/CD observado para `b9140f8`:

| Workflow | Ejecución | Resultado | Evidencia/causa |
|---|---|---|---|
| CI | [Run 44200949099](https://github.com/Josue-coder874/DistriR-pido-S.A.C./actions/runs/44200949099) | Éxito | CI completa |
| Automated Tests | [Run 44201095586](https://github.com/Josue-coder874/DistriR-pido-S.A.C./actions/runs/44201095586) | Fallo | Playwright 1.55 no soporta Ubuntu 26.04; workflow actualizado a `ubuntu-24.04`, pendiente de reejecución |
| Deploy Production | [Run 44200949013](https://github.com/Josue-coder874/DistriR-pido-S.A.C./actions/runs/44200949013) | Fallo | Falta el secreto requerido `VERCEL_TOKEN`; requiere configuración por el propietario del repositorio |

La suite E2E todavía requiere secretos `E2E_EMAIL` y `E2E_PASSWORD` para ejecutar la prueba positiva de autenticación; sin ellos ese caso se omite. No se configuraron ni se incluyeron credenciales en el repositorio.

Los artefactos no deben incluir usuarios, contraseñas, tokens ni URIs privadas. Las pruebas de laboratorio no equivalen a datos de campo ni por sí solas certifican Core Web Vitals.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Se incorpora la suite Playwright, la configuración multi-navegador y el protocolo de medición. |
| 1.0.1 | 2026-11-17 | Se documentan resultados de humo observados en Vercel, separándolos de las pruebas E2E, métricas y sondeos todavía pendientes. |
| 1.0.2 | 2026-11-17 | Se registran resultados de CI, pruebas unitarias y medición preliminar de API; se documentan bloqueos de Playwright/despliegue y se actualiza el runner a Ubuntu 24.04. |
