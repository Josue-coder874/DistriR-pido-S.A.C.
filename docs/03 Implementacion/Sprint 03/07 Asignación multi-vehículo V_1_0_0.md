[← Volver al README Principal](../../../README.md)

# Avance de implementación: asignación multi-vehículo y capacidad

| Campo | Detalle |
|---|---|
| **Proyecto** | EcoLogística Lima – DistriRápido S.A.C. |
| **Requisito relacionado** | RF-005 |
| **Fecha de corte** | 2026-11-10 |
| **Versión** | 1.0.0 |
| **Estado** | Implementado y validado localmente; aceptación formal pendiente |

## Alcance implementado

- Los pedidos nuevos requieren una demanda positiva en kg. La base SQLite añade `demand_kg` de forma compatible; los registros históricos sin peso deben completarlo desde Pedidos antes de poder asignarse.
- La optimización automática utiliza todos los vehículos activos. Si se selecciona uno explícitamente, la optimización se limita a ese vehículo.
- OR-Tools asigna pedidos a rutas de vehículos y aplica la capacidad máxima por vehículo junto con las ventanas de entrega existentes.
- La respuesta contiene métricas, carga y capacidad por ruta, además de `unassigned`, con código y explicación para cada pedido no asignado. Los pedidos sin peso, sin vehículos disponibles o que exceden la capacidad no se asignan silenciosamente.
- Se mantiene explícita la ruta de un solo vehículo cuando el cliente selecciona ese vehículo.

## Evidencia de rendimiento local

La prueba sintética `test_optimizer_150_orders_and_15_vehicles_completes_within_45_seconds` crea 150 pedidos de 50 kg y 15 vehículos de 1,000 kg, mide la llamada HTTP completa de optimización y comprueba la asignación de todos los pedidos, la capacidad por ruta y un tiempo menor o igual a 45 segundos. En la ejecución local del 2026-11-10, la prueba tardó **2.26 segundos**. Este resultado corresponde a datos sintéticos, hardware y dependencias locales; no garantiza el mismo tiempo en producción ni cubre tráfico vial real.

## Límites no cubiertos

- **Pico y placa no está implementado.** No se agregaron campos ni reglas especulativas. Para implementarlo hay que definir fecha y hora planificadas, jurisdicción, calendario oficial de restricciones por dígito de placa y excepciones vigentes.
- El modelo actual representa clientes/paradas como pedidos y todavía no incorpora estados de pedido confirmado, conductores ni asignación de conductores.
- La asignación es una propuesta de optimización por petición; no se persisten rutas ni se cambian estados de pedidos.
- No se calcula retorno a depósito: el modelo geográfico usa un nodo ficticio para una ruta abierta. La distancia y los costos siguen las estimaciones documentadas de tramos entre paradas.
- Las restricciones horarias y el límite de tiempo del solver pueden dejar pedidos sin asignar; el endpoint comunica ese resultado y el motivo disponible, pero se requiere validación operativa con datos reales.
- El escenario medido no constituye una prueba de carga en staging ni una aceptación de stakeholders.

## Historial

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-10 | Se documenta el alcance, el resultado local de 150 pedidos/15 vehículos y los criterios pendientes de RF-005. |

[Volver al README Principal](../../../README.md)
