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
- SQLAlchemy
- SQLite en desarrollo local; PostgreSQL en producción tras completar la migración a Supabase

Los clientes/pedidos pueden incluir `window_start` y `window_end` en formato `HH:MM`. Las ventanas son opcionales, pero se deben enviar ambas; el optimizador las trata como límites de llegada el mismo día y contempla el tiempo de viaje y 10 minutos de servicio por parada. Si la ruta no puede cumplirlas, `POST /api/routes/optimize` responde `422`. Al arrancar, `init_db()` agrega esas columnas si se usa una base SQLite creada por una versión anterior.

## Migración a PostgreSQL/Supabase

El backend conserva SQLite como valor predeterminado local. Configura `DATABASE_URL` como variable privada para apuntar a PostgreSQL; se aceptan URI `postgres://` y `postgresql://`, que se normalizan al controlador Psycopg 3. No guardes la URI ni la contraseña en el repositorio, el frontend o el chat.

El esquema PostgreSQL se gestiona con Alembic y no se crea ni modifica automáticamente al iniciar la API. Desde esta carpeta, ejecuta `python -m alembic upgrade head` antes del primer arranque. La API comprueba que la revisión de la base coincida con la última migración. SQLite local mantiene su inicialización compatible con bases existentes.

## Despliegue de la API en Render

El Blueprint del repositorio (`render.yaml`) configura un servicio web Python gratuito de demostración desde `main`, con raíz `src/backend`, comprobación de salud en `/` y puerto asignado por Render. Tras conectar el repositorio a Render, crea el servicio desde ese Blueprint. El plan Free puede suspender el servicio por inactividad y no es una opción de disponibilidad garantizada para producción.

Configura en Render las variables que el Blueprint solicita: `DATABASE_URL` (URI de Supabase privada), `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` (origen HTTPS exacto de Vercel; pueden ser el mismo valor), y las credenciales de un proveedor SMTP real. Render genera `SECRET_KEY`. No copies el `.env` local completo ni pongas secretos en `render.yaml`.

La migración `0001_initial_schema` ya debe estar aplicada a Supabase antes de iniciar la API. El servicio verifica la revisión al arrancar; si se agrega una migración nueva, aplícala a la base antes de desplegar código que la requiera. Después del despliegue, comprueba la URL de salud, autenticación, CORS desde el dominio de Vercel, envío de correo y optimización de rutas. La URI de Supabase no debe exponerse al frontend.

Para transferir los datos locales a una base PostgreSQL recién migrada:

1. Detén la API y crea una copia de seguridad de `app.db` fuera del repositorio.
2. Configura `DATABASE_URL` de destino de forma privada. La API desplegada en Render debe usar un URI de PostgreSQL válido para esa red; usa el pooler de Supabase si la conexión directa no es accesible.
3. Ejecuta primero una simulación, desde esta carpeta: `python -m scripts.migrate_sqlite_to_postgres --source app.db`. La herramienta informa únicamente cantidades por tabla y se niega a continuar si el esquema de origen/destino no es compatible o el destino no está vacío.
4. Revisa las cantidades y confirma la importación con `python -m scripts.migrate_sqlite_to_postgres --source app.db --apply`; escribe `IMPORT` cuando se solicite. La carga conserva claves primarias y datos relacionados, se ejecuta en una transacción y verifica los recuentos antes de confirmar.
5. Ejecuta `python -m pytest` y valida la API contra PostgreSQL antes de cambiar el tráfico de producción. Conserva el SQLite original y su respaldo hasta comprobar la migración.

La importación no borra ni modifica el archivo SQLite de origen. No ejecutes `--apply` contra una base con datos: el comando está diseñado para un destino vacío y aborta si encuentra filas en las tablas de la aplicación.

## Listados paginados

`GET /api/customers` y `GET /api/vehicles` aceptan `page` (desde 1) y `page_size` (de 1 a 100; predeterminado 12 cuando se solicita paginación). Al incluir cualquiera de esos parámetros, la respuesta contiene `items`, `total`, `page`, `page_size` y `total_pages`, con orden estable por ID. Sin parámetros, los endpoints conservan la respuesta de lista para clientes existentes. La paginación de vehículos mantiene el filtro `include_retired`.

Cada nuevo pedido requiere `demand_kg` positivo. El campo se almacena en `customers.demand_kg`; la migración SQLite lo agrega como nullable para no inventar carga para registros históricos. Estos registros se devuelven como pedidos sin asignar hasta que se complete su peso mediante `PATCH /api/customers/{customer_id}`.

`POST /api/routes/optimize` usa el vehículo indicado por `vehicle_id` cuando se envía. Si se omite, toma toda la flota activa; si no hay vehículos activos, devuelve los pedidos explícitamente como no asignados. La optimización devuelve `routes` con vehículos, paradas, cargas y métricas por ruta, además de `unassigned` con el código y motivo de cada pedido no asignado. Los pesos se contrastan con la capacidad de cada vehículo. Si se envía `stops`, optimiza esa lista; si se omite, carga todos los clientes de la base de datos, no solo la página visible de la interfaz.

La salida de optimización es una propuesta calculada en la petición; no se persiste como rutas, no cambia el estado de pedidos y no asigna conductores. El incremento no implementa pico y placa. Para hacerlo faltan, como mínimo, la fecha y hora planificadas de reparto, el ámbito/jurisdicción aplicable y un catálogo mantenido de reglas de restricción y excepciones asociadas a dígitos de placa. Tampoco se modelan todavía pedidos confirmados/estados de pedido ni una asignación de conductores.

## Configuración segura

En desarrollo, la API permite `FRONTEND_URL` local. Para staging o producción, configura `ENVIRONMENT`, una `SECRET_KEY` generada con al menos 32 bytes, `FRONTEND_URL` y `CORS_ALLOWED_ORIGINS` con orígenes HTTPS explícitos, además de `SMTP_HOST`. No uses `*` en CORS. El TLS debe terminar en el proxy o balanceador; verifica que la aplicación reciba correctamente el esquema HTTPS para habilitar HSTS. La configuración local no sustituye la verificación del despliegue.
