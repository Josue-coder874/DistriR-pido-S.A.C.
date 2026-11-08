[← Volver al README Principal](../../../README.md)

# Retrospectiva del Sprint — Sprint 2

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Sprint** | Sprint 2 · del 2026-09-28 al 2026-10-09 |
| **Fecha de la reunión** | Pendiente de registrar en el acta final de retrospectiva |
| **Estado del documento** | Documento con hechos verificables y propuestas para la reunión de equipo |
| **Versión** | 1.0.0 |

---

## 1. Seguimiento de las acciones del Sprint 1

Acciones definidas en la [Retrospectiva del Sprint 1](../Sprint%201/04%20Retrospectiva%20del%20Sprint%20V_1_1_0.md).

| # | Acción | Estado | Evidencia |
| ---: | --- | --- | --- |
| A1 | Reforzar la separación de responsabilidades entre backend, frontend y QA. | Parcial | Los roles de desarrollo están definidos, pero todavía debe formalizarse la responsabilidad de QA en el equipo. |
| A2 | Completar la definición del modelo de datos con mayor nivel de detalle. | Parcial | Se agregaron usuarios, flota, tokens de recuperación y auditoría. Faltan pedidos, conductores y rutas persistidas. |
| A3 | Mejorar la integración bidireccional frontend-backend. | Cumplida | El frontend usa la API real con sesión, listas y mensajes de error. |
| A4 | Implementar revisiones semanales de alcance y riesgos. | Parcial | Existe Registro de Riesgos, pero requiere actualizarse con el estado de este sprint. |
| A5 | Definir un plan de pruebas funcionales y de rendimiento. | Parcial | Hay 156 pruebas funcionales y cobertura superior al 80%. Falta la prueba de rendimiento con 150 pedidos y 15 vehículos. |

## 2. Datos del sprint para la discusión

| Indicador | Sprint 1 | Sprint 2 |
| --- | --- | --- |
| Story Points funcionalmente completos | 0 | 11 |
| Pruebas automatizadas | 0 | 156 |
| Cobertura (backend / frontend) | No medida | 95% / 94.6% |
| Impedimentos abiertos al corte | 2 | 7 |
| Criterios de la DoD cumplidos | 0 de 7 | 3 de 7 |

Defectos encontrados y corregidos durante el sprint:

- El frontend mostraba datos de demostración cuando la API devolvía una lista vacía.
- Los errores del frontend al guardar clientes u optimizar rutas no se comunicaban correctamente.
- Una parada omitía la longitud en el esquema, haciendo depender la distancia solo de la latitud.

## 3. ¿Qué aprendimos?

- La automatización de pruebas permite detectar defectos antes de la demostración.
- Las reglas de negocio que dependen de parámetros estimados necesitan validación temprana con el Product Owner.
- La integración entre capas debe verificarse con pruebas end-to-end y datos de ejemplo representativos.

## 4. ¿Qué estamos haciendo bien?

- Trabajamos con responsabilidades separadas entre backend, frontend y documentación.
- Mantenemos una cobertura superior al objetivo establecido en la DoD.
- Documentamos impedimentos, decisiones técnicas y desviaciones respecto al diseño planificado.

## 5. ¿Qué podemos hacer mejor?

### Personas

Definir turnos de revisión y responsabilidad por cada actividad técnica, incluyendo QA, infraestructura y documentación.

### Relaciones

Revisar decisiones de alcance con el Product Owner al inicio de cada semana y registrar acuerdos para evitar interpretaciones diferentes.

### Procesos

Aplicar la Definition of Done completa antes de cerrar historias. Debe exigirse control de cambios, revisión por pares, CI/CD y validación en Staging.

### Herramientas

Inicializar Git, proteger la rama principal, integrar Pull Requests y configurar GitHub Actions para pruebas y análisis estático.

### Acciones a realizar

La tabla siguiente convierte las oportunidades anteriores en compromisos medibles para el Sprint 3.

## 6. Acciones para el Sprint 3

| # | Acción | Responsable | Fecha objetivo |
| ---: | --- | --- | --- |
| B1 | Inicializar el repositorio Git y trabajar con Pull Requests. | Líder del proyecto | 2026-10-16 |
| B2 | Configurar CI con pruebas automatizadas y análisis estático. | Líder del proyecto | 2026-10-23 |
| B3 | Validar con el Product Owner los supuestos de costo y emisiones. | Líder del proyecto | 2026-10-16 |
| B4 | Ejecutar la prueba de rendimiento del motor con 150 pedidos y 15 vehículos. | Equipo backend | 2026-10-23 |
| B5 | Actualizar el Registro de Riesgos con el estado del Sprint 2. | Scrum Master | 2026-10-16 |
| B6 | Definir responsables de QA y realizar revisiones semanales. | Líder del proyecto | 2026-10-16 |

## 7. Estado de cierre en Jira

El equipo verificó el tablero y cerró las 18 actividades del proyecto, desde `LD-9` hasta `LD-26`, asignadas a Josue Gonzales Silupu con fecha de vencimiento 2026-10-09. El estado Listo en Jira representa el cierre administrativo de las actividades; los pendientes técnicos propios se mantienen registrados en el Informe de Estado para evitar confundir trazabilidad documental con finalización funcional.

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-10-06 | Versión inicial de la Retrospectiva del Sprint 2, con seguimiento, reflexiones verificables y plan de acciones. |

[Volver al README](../../../README.md)
