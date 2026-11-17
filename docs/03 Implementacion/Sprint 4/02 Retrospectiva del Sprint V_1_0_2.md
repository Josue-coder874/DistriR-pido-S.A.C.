[← Volver al README principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu
**Versión:** V_1_0_2

## ¿Qué aprendimos?

- Separar backend y frontend simplifica el despliegue, pero exige definir de forma explícita CORS, variables públicas y variables privadas.
- La configuración de producción debe validar secretos y esquema de base antes de iniciar la API; una variable ausente puede provocar fallos visibles aunque el build haya terminado.
- Las métricas de rendimiento y usabilidad solo son defendibles si identifican runner, navegador, viewport, región, carga, fecha y método de cálculo.

## ¿Qué estamos haciendo bien?

- Mantenemos backend, frontend, pruebas y documentación dentro de un monorepo claro.
- Automatizamos pruebas unitarias y de cobertura con GitHub Actions.
- Conservamos secretos fuera del código y usamos Supabase para PostgreSQL.
- Definimos criterios de éxito antes de medir disponibilidad y tiempos de API.

## ¿Qué podemos hacer mejor?

### Personas
Asignar a cada actividad un responsable de ejecución, un revisor técnico y una fecha verificable. La demo debe contar con un operador principal y un usuario que capture evidencia.

### Relaciones
Coordinar frontend y backend antes de cambiar dominios o nombres de variables. Los stakeholders deben confirmar la misma versión desplegada antes de responder el SUS.

### Procesos
Unir despliegue, validación HTTP y revisión de logs antes de cerrar una actividad. Toda métrica debe incluir fuente, fecha, entorno y resultado reproducible.

### Herramientas
- Usar reportes HTML de Playwright como artefactos de Actions.
- Publicar las variables de producción en Vercel sin incluir secretos en documentación.
- Mantener un único registro de despliegues, dominios y revisiones de Supabase.

### Acciones a realizar

| Acción | Responsable | Fecha objetivo | Métrica de seguimiento |
|---|---|---|---|
| Completar el despliegue y verificar `/` y `/docs` | Josue Gonzales Silupu | 2026-11-19 | HTTP 2xx en backend y dominio público cargado |
| Ejecutar Playwright en Chromium, Firefox y WebKit | Esau Landeon Arrellano | 2026-11-20 | 100% de casos aplicables aprobados al primer intento |
| Ejecutar medición de 20 muestras por página y 30 solicitudes por endpoint | Nayely Cuicapuza Remigio | 2026-11-20 | Conjuntos completos, sin eliminación de fallos o atípicos |
| Capturar cinco respuestas SUS y calcular el promedio | Nayely Cuicapuza Remigio | 2026-11-21 | n >= 5, respuestas completas y promedio redondeado a un decimal |

### Seguimiento al 2026-11-17

- Se completó la verificación de humo de producción de la raíz, documentación y OpenAPI de la API. Las pruebas unitarias/integración locales pasaron: backend 172/172, frontend 89/89; build frontend aprobado.
- La primera medición de 30 solicitudes por endpoint mostró p95 de 958.3 ms en `/`, 907.0 ms en `/openapi.json` y 750.4 ms en `/api/customers` sin autenticación. No alcanza el objetivo indicativo p95 menor a 500 ms; falta repetir desde un runner externo documentado.
- Se midieron 20 cargas de la pantalla de login: FCP p75 436 ms y LCP p75 468 ms. Esta muestra no cubre módulos autenticados ni sustituye el protocolo completo de laboratorio.
- La suite Playwright ya instala los navegadores en Ubuntu 24.04, pero el run 44202334520 falló porque faltaba declarar `@playwright/test`; la dependencia ya se agregó y falta volver a ejecutar. Los secretos de usuario E2E siguen pendientes.
- El workflow de despliegue de GitHub Actions no dispone de `VERCEL_TOKEN` (run 44202217070); la publicación de producción comprobada se realizó desde Vercel.
- No se recogieron respuestas SUS. Los 60 sondeos de disponibilidad y la demo autenticada también siguen pendientes.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Retrospectiva del Sprint 4 con acciones responsables y métricas verificables. |
| 1.0.1 | 2026-11-17 | Se agregan resultados verificados de pruebas, API y CI/CD, manteniendo explícitamente las acciones pendientes. |
| 1.0.2 | 2026-11-17 | Se añaden resultados FCP/LCP y se actualiza el diagnóstico de los workflows Playwright y despliegue. |
