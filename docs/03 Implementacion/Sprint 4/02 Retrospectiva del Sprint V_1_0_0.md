[← Volver al README principal](../../../README.md)

# Retrospectiva del sprint

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu

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

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Retrospectiva del Sprint 4 con acciones responsables y métricas verificables. |
