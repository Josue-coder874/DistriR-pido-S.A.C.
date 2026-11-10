[← Volver al README Principal](../../../README.md)

# Avance de implementación: ventanas de entrega y mapa

| Campo | Detalle |
|---|---|
| **Proyecto** | EcoLogística Lima – DistriRápido S.A.C. |
| **Iteraciones relacionadas** | Iteración 2 y 3 |
| **Fecha de corte** | 2026-11-10 |
| **Versión** | 1.0.0 |
| **Estado** | Implementado y verificado localmente; aceptación formal pendiente |

## 1. Objetivo

Registrar el avance técnico de dos cambios implementados para acercar el producto a las iteraciones planificadas:

- ventanas horarias opcionales para entregas y consideración de esas restricciones en la optimización;
- visualización de la secuencia de paradas en un mapa con OpenStreetMap.

Este documento describe únicamente el alcance implementado. No declara completas las iteraciones ni los requisitos funcionales relacionados.

## 2. Ventanas de entrega — Iteración 2

### Comportamiento implementado

- Los formularios de pedidos permiten indicar `window_start` y `window_end` en formato de hora `HH:MM`; el rango puede omitirse.
- Si se indica un extremo del rango, se exige el otro; la hora de fin debe ser posterior a la de inicio.
- La API persiste y devuelve las horas junto al cliente/pedido.
- Al arrancar con una base SQLite existente, el backend agrega las columnas faltantes `window_start` y `window_end`.
- El optimizador usa las ventanas como límites de llegada el mismo día. Estima el viaje a 25 km/h y considera 10 minutos de servicio por parada.
- Si OR-Tools no encuentra una solución factible dentro del límite de búsqueda, el endpoint devuelve `422` con un mensaje explícito; no presenta el orden de prioridad como si cumpliera las ventanas.
- Las horas se muestran en el listado de pedidos y junto a las paradas en la ruta sugerida.

### Límites pendientes

- El modelo actual sigue siendo de clientes/paradas y no cubre todos los datos de pedidos y entregas descritos en RF-004.
- Las ventanas no calculan ni devuelven hora estimada de llegada; se utilizan como restricciones de optimización.
- La velocidad de 25 km/h y el servicio de 10 minutos son estimaciones, no valores validados con datos de campo.
- El problema sigue optimizando una sola ruta/vehículo. Asignación multi-vehículo, capacidad, pico y placa y pruebas de rendimiento para 150 pedidos y 15 vehículos siguen pendientes.

## 3. Mapa de ruta — Iteración 3

### Comportamiento implementado

- La respuesta del optimizador incluye `route_stops`: identificador, nombre y coordenadas ordenadas según la solución.
- La vista de rutas muestra paradas numeradas, la línea de conexión en orden, controles para acercar y alejar y atribución a OpenStreetMap.
- El mapa conserva la lista de paradas como alternativa accesible y muestra ventanas de entrega en el detalle de las paradas.
- Se excluyen del mapa coordenadas fuera de rango y se presenta un mensaje cuando no hay coordenadas válidas.
- Las imágenes cartográficas se cargan desde OpenStreetMap, por lo que la visualización del fondo requiere conexión a internet.

### Límites pendientes

- La línea entre paradas es esquemática y conecta coordenadas en línea recta; no sigue calles.
- No existe integración con Waze, Google Maps ni un servicio de ruteo vial o tráfico en tiempo real.
- No se calcula ETA por parada, no se almacena la ruta para uso sin conexión ni se ofrece caché offline al conductor.
- OpenStreetMap aporta el mapa base, no los datos de tráfico.

## 4. Evidencia y validación local

Pruebas relevantes añadidas:

- Backend: persistencia y validación de las ventanas; migración de SQLite existente; orden factible, ventana incompleta y caso sin ruta factible; coordenadas ordenadas de la respuesta.
- Frontend: envío del rango, presentación de ventanas, orden y coordenadas del mapa, controles de zoom y rechazo de coordenadas no válidas.

Resultados al 2026-11-10:

| Validación | Resultado |
|---|---|
| `py -3.12 -m pytest -q` desde `src/backend` | 132 pruebas aprobadas |
| `npm test` desde `src/frontend` | 85 pruebas aprobadas |
| `npm run build` desde `src/frontend` | Compilación de producción exitosa |

Estos resultados son evidencia técnica local. No reemplazan pruebas de aceptación con stakeholders, despliegue en Staging ni pruebas de carga.

## 5. Trabajo pendiente para completar las iteraciones

- Realizar y documentar entrevistas reales a conductores y recopilar datos de tráfico verificables en Lima.
- Validar las estimaciones operativas con datos reales.
- Integrar un proveedor aprobado para trazado de calles y tráfico; documentar credenciales y límites de uso sin incluir secretos.
- Incorporar asignación de varios vehículos, capacidad, restricciones vehiculares y mediciones de rendimiento.
- Generar y mostrar horarios estimados de llegada por parada.
- Evaluar operación offline y sincronización de rutas para conductores.
- Ejecutar aceptación de usuarios, evaluación WCAG y pruebas en Staging.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-10 | Registro del alcance, evidencia de pruebas y pendientes del incremento de ventanas de entrega y mapa. |

[Volver al README](../../../README.md)
