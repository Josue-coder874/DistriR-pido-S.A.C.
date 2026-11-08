[← Volver al README Principal](../../../README.md)

# Registro de Impedimentos — Sprint 1

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Sprint** | Sprint 1 · del 2026-09-14 al 2026-09-25 |
| **Versión** | 1.1.0 |

---

Estado registrado al cierre del Sprint 1. Los impedimentos abiertos continúan en el [Registro de Impedimentos del Sprint 2](../Sprint%202/02%20Registro%20de%20Impedimentos%20V_1_0_0.md).

| Impedimento # | Fecha de Registro | Descripción del Impedimento y su impacto en el proyecto | Prioridad | Reportado por | Fecha tope de Resolución | Estado | Fecha de Resolución | Resolución / Comentarios |
|---:|---|---|---|---|---|---|---|---|
| 1 | 2026-09-17 | Falta de definición clara del alcance funcional de la optimización de rutas y de la estructura de datos base, lo que genera retrabajo en backend y frontend. | Alta | Josue Gonzales Silupu | 2026-09-20 | Resuelto | 2026-09-20 | Se definió el alcance mínimo del Sprint 1 y se documentó la estructura inicial de entidades y flujos. |
| 2 | 2026-09-18 | Dificultad para coordinar la configuración inicial del entorno con Python, React y PostgreSQL/PostGIS, afectando la preparación del entorno de desarrollo. | Media | Nayely Cuicapuza Remigio | 2026-09-22 | Resuelto parcialmente | 2026-09-22 | Se estandarizó la instalación de dependencias por módulo (`requirements.txt` y `package.json`). Docker Compose y PostgreSQL/PostGIS no llegaron a configurarse en el repositorio: la base de datos es SQLite. Se traslada como impedimento #6 al Sprint 2. |
| 3 | 2026-09-21 | Se identificó que la lógica de optimización requiere un análisis más profundo de restricciones reales del negocio, lo que puede afectar tiempos de desarrollo del algoritmo. | Alta | Esau Landeon Arrellano | 2026-09-25 | Abierto al cierre (trasladado al Sprint 2) | - | Se priorizó la definición de restricciones básicas. Al cierre del sprint el motor solo ordenaba por prioridad. |
| 4 | 2026-09-23 | Falta de integración funcional entre el frontend y el backend durante la primera semana de desarrollo, lo que retrasa la validación end-to-end. | Media | Esau Landeon Arrellano | 2026-09-27 | Abierto al cierre (trasladado al Sprint 2) | - | Se estableció la API base y la estructura de payloads. El frontend ocultaba los errores de la API y mostraba datos de demostración. |

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-09-29 | Versión inicial del Registro de Impedimentos del Sprint 1. |
| 1.1.0 | 2026-10-06 | Corrección del reportante del impedimento #4; el #2 pasa a "Resuelto parcialmente" (Docker Compose y PostGIS no están en el repositorio); los #3 y #4 se registran como abiertos al cierre y se trasladan al Sprint 2. |

[Volver al README](../../../README.md)
