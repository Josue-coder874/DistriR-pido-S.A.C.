[← Volver al README Principal](../../../README.md)

# Revisión del Sprint 3

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Líder del Proyecto:** Josue Gonzales Silupu
**Versión:** V_1_1_0

## Historias de Usuario completadas en este Sprint

- LD-15 US-007: continuación de la optimización automática de rutas, con asignación, fecha y responsable migrados al Sprint 3 desde Jira.
- LD-21 ENB-02: hardening de seguridad y auditoría mediante pruebas y controles aplicados.
- LD-25 ENB-06: integración modular del motor de optimización y separación de responsabilidades.

Se recomienda cerrar estos ítems solo después de demostrar y validar los criterios reales de aceptación.

## Demostración del trabajo completado

La demostración incluye autenticación, RBAC, flota, pedidos, optimización de rutas, dashboard, navegación modular y pruebas automatizadas. Los módulos Dashboard, Pedidos, Rutas y Flota se presentan como pantallas independientes del frontend. El seguimiento del 2026-11-10 y las limitaciones de los incrementos de ventanas horarias y mapa se registran en [Avance de ventanas de entrega y mapa](06%20Avance%20ventanas%20de%20entrega%20y%20mapa%20V_1_0_0.md).

## Seguimiento de implementación al 2026-11-10

Se verificaron localmente los siguientes incrementos posteriores a la revisión inicial del sprint:

| Requisito | Incremento implementado | Evidencia y validación | Alcance que sigue pendiente |
|---|---|---|---|
| RF-004 Gestión de pedidos | Ventana de entrega opcional con horas de inicio y fin. La API exige ambas horas y valida que la hora final sea posterior. Se agregó una migración automática para bases SQLite existentes. | `src/backend/app/schemas.py`, `src/backend/app/database.py`, `src/frontend/src/components/OrdersView.jsx`; pruebas de API y formulario. | El modelo de pedidos sigue siendo básico; no incluye todavía todos los datos de negocio, contactos, referencias y estados del RF-004. |
| RF-005 Generación de rutas | OR-Tools considera las ventanas como restricciones de llegada, el tiempo estimado de viaje y 10 minutos de servicio por parada. Si no encuentra solución factible dentro del límite del solver, la API responde `422`. | `src/backend/app/services/routing_service.py`, `src/backend/tests/test_customers.py`; prueba de orden factible, ventana incompleta e incompatibilidad. | No equivale al VRPTW completo: siguen pendientes asignación multi-vehículo, capacidad, pico y placa, medición formal de rendimiento y prueba de 150 pedidos/15 vehículos. La velocidad urbana es una estimación de 25 km/h. |
| RF-006 Visualización en mapa | El optimizador devuelve las paradas en orden con coordenadas; la vista de rutas muestra marcadores numerados y una línea esquemática sobre mosaicos de OpenStreetMap, con controles de zoom. | `src/backend/app/services/routing_service.py`, `src/frontend/src/components/RouteMap.jsx`, `src/frontend/src/components/RouteMap.test.jsx`; build de producción validado. | La línea conecta puntos en línea recta: no sigue calles, no calcula ETA por parada, no utiliza tráfico de Waze/Google Maps y el mapa requiere internet. Tampoco ofrece descarga local ni modo offline para conductores. |

**Validación automatizada al 2026-11-10:** `py -3.12 -m pytest -q` en `src/backend`: 132 pruebas aprobadas; `npm test` en `src/frontend`: 85 pruebas aprobadas; `npm run build` en `src/frontend`: compilación correcta. Estas pruebas son evidencia técnica local, no sustituyen pruebas de aceptación con stakeholders, CI, staging ni pruebas de carga.

## Pendientes

- Validar pruebas de carga con 150 pedidos y 15 vehículos.
- Publicar el análisis SonarCloud y la evidencia WCAG.
- Desplegar el entorno de Staging.
- Completar validaciones manuales WCAG no cubiertas por Lighthouse/axe.
- Integrar un proveedor de trazado vial y tráfico cuando se apruebe su uso y se configuren sus credenciales.
- Calcular y presentar horarios estimados de llegada por parada; actualmente se usan ventanas como restricciones, pero no se devuelven ETA.
- Evaluar caché o descarga del mapa y la última ruta para el uso con conectividad intermitente.
- Completar la investigación de campo de Lima con entrevistas reales y datos de tráfico verificables; no existe evidencia de esa actividad en este incremento.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-08 | Revisión inicial del Sprint 3. |
| 1.1.0 | 2026-11-10 | Se agrega evidencia local de ventanas de entrega y mapa, manteniendo explícitos los criterios y entregables aún pendientes. |

[Volver al README Principal](../../../README.md)
