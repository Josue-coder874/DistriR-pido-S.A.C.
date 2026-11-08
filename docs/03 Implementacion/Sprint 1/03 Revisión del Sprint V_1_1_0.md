[← Volver al README Principal](../../../README.md)

# Revisión del Sprint — Sprint 1

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Sprint** | Sprint 1 · del 2026-09-14 al 2026-09-25 |
| **Fecha de la reunión** | [COMPLETAR] |
| **Asistentes** | [COMPLETAR: equipo y stakeholders presentes] |
| **Versión** | 1.1.0 |

---

## 1. Incremento demostrado

Se realizó la demostración ante los stakeholders del alcance entregado en el Sprint 1:

- registro y listado de clientes con dirección, coordenadas y prioridad, guardados en la base de datos;
- generación de una ruta inicial que ordena los clientes por prioridad;
- estimación preliminar de distancia, tiempo y costo de la ruta;
- panel web con indicadores, formulario de clientes y la ruta sugerida como lista de paradas;
- organización del repositorio por frontend y backend, y documentación de la instalación local.

## 2. Resultado por ítem

| ID original | Ítem del backlog | Presentado | Resultado |
| --- | --- | --- | --- |
| HU-01 | US-005 Registro de pedidos con ventana de tiempo | Sí | Avance parcial: clientes sin ventana de tiempo. |
| HU-02 / HU-03 | US-007 Generación automática de rutas óptimas | Sí | Avance parcial: ordenamiento por prioridad con fórmulas provisionales. |
| HU-04 | US-009 Visualización de ruta en mapa | No | No implementado: la ruta se muestra como lista. |
| HU-05 | Tarea técnica de entorno | Sí | Avance parcial: instalación local sin Docker Compose ni PostGIS. |

## 3. Retroalimentación de los stakeholders

Los stakeholders confirmaron que la solución cumple con el objetivo principal del Sprint 1: dejar una base funcional y una estructura clara para la evolución del sistema en los siguientes sprints.

[COMPLETAR: observaciones o solicitudes concretas de los stakeholders, si las hubo.]

## 4. Ajustes al backlog

- US-009 (mapa) vuelve al backlog sin avance.
- La configuración de Docker Compose con PostgreSQL/PostGIS queda pendiente; se debe decidir si se implementa o se ajusta el stack planificado.
- US-001 (inicio de sesión), US-002 (control de acceso) y US-003 (flota) se priorizan como prerrequisitos de los demás módulos.

## 5. Pendientes

- Mejorar la integración entre frontend y backend con datos reales.
- Definir el modelo de negocio final para rutas, clientes y entregas.
- Incorporar restricciones operativas completas en la optimización de rutas.
- Validar la usabilidad del módulo para casos reales de distribución.
- Incluir pruebas automatizadas y métricas de desempeño del algoritmo.

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-09-29 | Versión inicial de la Revisión del Sprint 1. |
| 1.1.0 | 2026-10-06 | Se retiran del incremento la visualización en mapa y el despliegue con Docker, que no forman parte del repositorio; se agregan el resultado por ítem del backlog y los ajustes al backlog. |

[Volver al README](../../../README.md)
