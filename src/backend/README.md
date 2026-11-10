# Backend

Este módulo concentra la lógica de negocio, APIs y procesos de optimización de rutas para EcoLogística Lima.

## Objetivo
- Exponer servicios REST para gestión de clientes, rutas y métricas.
- Orquestar el cálculo de rutas con restricciones de costo, tiempo y emisiones.
- Gestionar la lógica del dominio y validaciones del negocio.

## Tecnologías
- Python
- FastAPI
- OR-Tools
- SQLite

Los clientes/pedidos pueden incluir `window_start` y `window_end` en formato `HH:MM`. Las ventanas son opcionales, pero se deben enviar ambas; el optimizador las trata como límites de llegada el mismo día y contempla el tiempo de viaje y 10 minutos de servicio por parada. Si la ruta no puede cumplirlas, `POST /api/routes/optimize` responde `422`. Al arrancar, `init_db()` agrega esas columnas si se usa una base SQLite creada por una versión anterior.

## Listados paginados

`GET /api/customers` y `GET /api/vehicles` aceptan `page` (desde 1) y `page_size` (de 1 a 100; predeterminado 12 cuando se solicita paginación). Al incluir cualquiera de esos parámetros, la respuesta contiene `items`, `total`, `page`, `page_size` y `total_pages`, con orden estable por ID. Sin parámetros, los endpoints conservan la respuesta de lista para clientes existentes. La paginación de vehículos mantiene el filtro `include_retired`.

Cada nuevo pedido requiere `demand_kg` positivo. El campo se almacena en `customers.demand_kg`; la migración SQLite lo agrega como nullable para no inventar carga para registros históricos. Estos registros se devuelven como pedidos sin asignar hasta que se complete su peso mediante `PATCH /api/customers/{customer_id}`.

`POST /api/routes/optimize` usa el vehículo indicado por `vehicle_id` cuando se envía. Si se omite, toma toda la flota activa; si no hay vehículos activos, devuelve los pedidos explícitamente como no asignados. La optimización devuelve `routes` con vehículos, paradas, cargas y métricas por ruta, además de `unassigned` con el código y motivo de cada pedido no asignado. Los pesos se contrastan con la capacidad de cada vehículo. Si se envía `stops`, optimiza esa lista; si se omite, carga todos los clientes de la base de datos, no solo la página visible de la interfaz.

La salida de optimización es una propuesta calculada en la petición; no se persiste como rutas, no cambia el estado de pedidos y no asigna conductores. El incremento no implementa pico y placa. Para hacerlo faltan, como mínimo, la fecha y hora planificadas de reparto, el ámbito/jurisdicción aplicable y un catálogo mantenido de reglas de restricción y excepciones asociadas a dígitos de placa. Tampoco se modelan todavía pedidos confirmados/estados de pedido ni una asignación de conductores.

## Configuración segura

En desarrollo, la API permite `FRONTEND_URL` local. Para staging o producción, configura `ENVIRONMENT`, una `SECRET_KEY` generada con al menos 32 bytes, `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` con orígenes HTTPS explícitos, además de `SMTP_HOST`. No uses `*` en CORS. El TLS debe terminar en el proxy o balanceador; verifica que la aplicación reciba correctamente el esquema HTTPS para habilitar HSTS. La configuración local no sustituye la verificación del despliegue.
