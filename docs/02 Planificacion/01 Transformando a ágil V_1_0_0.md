[← Volver al README Principal](../../README.md)

# Transformando a Ágil

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Integrantes** | Josue [Apellidos] · [Nombre integrante 2] · [Nombre integrante 3] |
| **Fecha** | 25 de agosto de 2026 |
| **Versión** | 1.0.0 |

---

## 1. Metodología de Transformación

Los Requerimientos Funcionales (RF-001 a RF-010, definidos en `docs/01 Inicio/06. Requisitos funcionales V_1_0_0.md`) se agruparon en **6 Épicas** según el módulo funcional al que pertenecen, y cada Épica se descompuso en Historias de Usuario (US). Los Requerimientos No Funcionales (RNF-001 a RNF-011, definidos en `docs/01 Inicio/07. Requisitos no funcionales V_1_0_0.md`) se transformaron en **Historias Técnicas (Enablers)** independientes, ya que representan trabajo de arquitectura, seguridad, rendimiento y accesibilidad que no es directamente visible como una acción de un rol de negocio, además de integrarse transversalmente como parte del Definition of Done.

### Mapeo Épicas → Requerimientos Funcionales

| Épica | Nombre | RF de origen |
| --- | --- | --- |
| EP-01 | Gestión de Identidad y Seguridad | RF-001, RF-010 |
| EP-02 | Gestión de Flota y Conductores | RF-002, RF-003 |
| EP-03 | Gestión de Pedidos | RF-004 |
| EP-04 | Motor de Optimización de Rutas | RF-005, RF-009 |
| EP-05 | Experiencia del Conductor en Ruta | RF-006 |
| EP-06 | Dashboard y Reportes de Sostenibilidad | RF-007, RF-008 |

### Mapeo Historias Técnicas (Enablers) → Requerimientos No Funcionales

| Enabler | Nombre | RNF de origen |
| --- | --- | --- |
| ENB-01 | Rendimiento del motor de optimización y la API | RNF-001, RNF-002, RNF-003 |
| ENB-02 | Hardening de seguridad (OWASP, cifrado, auditoría) | RNF-004, RNF-005, RNF-006 |
| ENB-03 | Infraestructura de alta disponibilidad (failover) | RNF-007 |
| ENB-04 | Cumplimiento de accesibilidad WCAG 2.1 AA | RNF-008 |
| ENB-05 | Compatibilidad multi-navegador y responsivo | RNF-009 |
| ENB-06 | Arquitectura desacoplada del motor de optimización | RNF-010 |
| ENB-07 | Modo offline-first para la app del conductor | RNF-011 |

---

## 2. Épicas e Historias de Usuario

### EP-01: Gestión de Identidad y Seguridad

**US-001**
```
ID: US-001
Título: Inicio de sesión con credenciales
Épica Relacionada: EP-01 Gestión de Identidad y Seguridad

Redacción:
Como usuario registrado del sistema,
quiero iniciar sesión con mi correo y contraseña,
para acceder a las funcionalidades correspondientes a mi rol.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Inicio de sesión exitoso
Dado un usuario registrado con estado ACTIVO y credenciales correctas
Cuando ingresa su correo y contraseña válidos
Entonces el sistema lo autentica y lo redirige al panel correspondiente a su rol

Escenario: Bloqueo por intentos fallidos
Dado un usuario que ingresa una contraseña incorrecta por tercera vez consecutiva
Cuando intenta autenticarse nuevamente
Entonces el sistema bloquea la cuenta por 15 minutos y muestra el tiempo restante de bloqueo
```

**US-002**
```
ID: US-002
Título: Control de acceso según rol (RBAC)
Épica Relacionada: EP-01 Gestión de Identidad y Seguridad

Redacción:
Como administrador del sistema,
quiero que cada módulo restrinja el acceso según el rol del usuario,
para evitar que personal no autorizado modifique o consulte información sensible.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Acceso denegado a módulo restringido
Dado un usuario con rol Conductor
Cuando intenta acceder a la URL del módulo de configuración del sistema
Entonces el sistema deniega el acceso, registra el intento en el log de auditoría y lo redirige a su panel autorizado

Escenario: Acceso de solo lectura para auditor
Dado un usuario con rol Auditor Externo
Cuando accede al módulo de exportación de logs de auditoría
Entonces el sistema permite únicamente la lectura, sin opciones de modificación o eliminación
```

---

### EP-02: Gestión de Flota y Conductores

**US-003**
```
ID: US-003
Título: Registro de vehículos de la flota
Épica Relacionada: EP-02 Gestión de Flota y Conductores

Redacción:
Como administrador de flota,
quiero registrar vehículos con su capacidad de carga y tipo de combustible,
para mantener actualizada la disponibilidad real de la flota en el sistema.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Registro exitoso de vehículo
Dado un administrador autenticado en el módulo de flota
Cuando registra un vehículo con placa, capacidad y tipo de combustible válidos
Entonces el sistema guarda el vehículo con estado ACTIVO y lo hace disponible para rutas

Escenario: Rechazo de placa duplicada
Dado un administrador que intenta registrar un vehículo con una placa ya existente
Cuando envía el formulario de registro
Entonces el sistema rechaza la operación y muestra un mensaje de error de conflicto de placa
```

**US-004**
```
ID: US-004
Título: Registro y verificación de licencia de conductores
Épica Relacionada: EP-02 Gestión de Flota y Conductores

Redacción:
Como administrador de flota,
quiero registrar conductores validando la vigencia de su licencia,
para evitar asignar rutas a conductores con documentación vencida.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Registro exitoso de conductor
Dado un administrador autenticado en el módulo de conductores
Cuando registra un conductor con licencia vigente
Entonces el sistema guarda el registro y lo habilita para ser asignado a rutas

Escenario: Bloqueo por licencia vencida
Dado un conductor cuya licencia se encuentra vencida
Cuando el sistema intenta asignarlo a una ruta
Entonces el sistema impide la asignación y muestra un mensaje indicando que la licencia está vencida
```

---

### EP-03: Gestión de Pedidos

**US-005**
```
ID: US-005
Título: Registro de pedidos con ventana de tiempo
Épica Relacionada: EP-03 Gestión de Pedidos

Redacción:
Como despachador,
quiero registrar pedidos con dirección y ventana de tiempo de entrega,
para que el motor de optimización los incluya en la generación de rutas.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Registro exitoso de pedido
Dado un despachador autenticado en el módulo de pedidos
Cuando registra un pedido con dirección, ventana de tiempo y contacto válidos
Entonces el sistema guarda el pedido como PENDIENTE y lo incluye en la próxima generación de rutas

Escenario: Rechazo de ventana de tiempo inconsistente
Dado un despachador que ingresa una ventana cuyo horario de fin es anterior al de inicio
Cuando intenta guardar el pedido
Entonces el sistema rechaza el registro y muestra un mensaje de error explícito
```

**US-006**
```
ID: US-006
Título: Registro de pedidos en zonas sin nomenclatura estándar
Épica Relacionada: EP-03 Gestión de Pedidos

Redacción:
Como despachador,
quiero registrar un punto de referencia cuando la dirección no tiene nomenclatura estándar,
para no excluir pedidos de zonas periféricas como San Juan de Lurigancho.
```
- **Story Points:** 2

**Criterios de Aceptación:**
```
Escenario: Registro con punto de referencia
Dado un pedido en una zona sin numeración estándar
Cuando el despachador ingresa un punto de referencia (ej. "frente al mercado Huáscar")
Entonces el sistema acepta el registro y lo marca para geolocalización asistida

Escenario: Pedido disponible tras geolocalización asistida
Dado un pedido marcado para geolocalización asistida
Cuando el operador confirma la ubicación aproximada en el mapa
Entonces el sistema habilita el pedido para ser incluido en la generación de rutas
```

---

### EP-04: Motor de Optimización de Rutas

**US-007**
```
ID: US-007
Título: Generación automática de rutas óptimas
Épica Relacionada: EP-04 Motor de Optimización de Rutas

Redacción:
Como despachador,
quiero generar automáticamente las rutas óptimas para los pedidos confirmados,
para reducir distancia, costo y emisiones de CO2 frente a la planificación manual.
```
- **Story Points:** 13

**Criterios de Aceptación:**
```
Escenario: Generación de rutas dentro del tiempo esperado
Dado un conjunto de pedidos confirmados y vehículos disponibles
Cuando el despachador solicita la generación de rutas
Entonces el sistema retorna una asignación válida en un tiempo menor o igual a 45 segundos para hasta 150 pedidos y 15 vehículos

Escenario: Exclusión de vehículos restringidos por pico y placa
Dado un conjunto de vehículos donde alguno está restringido por pico y placa en la fecha de reparto
Cuando el sistema genera las rutas
Entonces excluye automáticamente los vehículos restringidos y reasigna sus pedidos a vehículos disponibles
```

**US-008**
```
ID: US-008
Título: Re-optimización dinámica ante incidentes
Épica Relacionada: EP-04 Motor de Optimización de Rutas

Redacción:
Como despachador,
quiero que el sistema recalcule las rutas afectadas cuando registro un incidente,
para minimizar el impacto de averías o cierres de vía en las entregas del día.
```
- **Story Points:** 8

**Criterios de Aceptación:**
```
Escenario: Reasignación tras avería de vehículo
Dado una ruta en ejecución y un incidente de avería registrado por el despachador
Cuando el sistema procesa el incidente
Entonces reasigna los pedidos pendientes a otros vehículos disponibles en un tiempo menor o igual a 30 segundos

Escenario: Pedidos sin vehículo disponible
Dado un incidente reportado cuando no existen vehículos disponibles para reasignación
Cuando el sistema intenta recalcular la ruta
Entonces notifica al despachador que los pedidos afectados quedan en estado "Pendiente de reasignación manual"
```

---

### EP-05: Experiencia del Conductor en Ruta

**US-009**
```
ID: US-009
Título: Visualización de ruta asignada en mapa
Épica Relacionada: EP-05 Experiencia del Conductor en Ruta

Redacción:
Como conductor,
quiero ver mi ruta asignada en un mapa simple desde mi celular,
para saber a dónde dirigirme sin depender de mi experiencia previa en la zona.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Visualización de ruta con conexión activa
Dado una ruta generada y asignada a un vehículo
Cuando el conductor abre el módulo de mapa con conexión a internet
Entonces el sistema despliega la secuencia de paradas y la hora estimada de llegada a cada punto

Escenario: Visualización de ruta con conectividad limitada
Dado un conductor con conectividad intermitente (2G/3G)
Cuando accede al mapa desde su dispositivo móvil
Entonces el sistema muestra la ruta ya descargada localmente sin requerir conexión continua
```

---

### EP-06: Dashboard y Reportes de Sostenibilidad

**US-010**
```
ID: US-010
Título: Dashboard de indicadores de sostenibilidad
Épica Relacionada: EP-06 Dashboard y Reportes de Sostenibilidad

Redacción:
Como administrador,
quiero visualizar indicadores de distancia, combustible, CO2 y cumplimiento de ventanas de tiempo,
para evaluar el impacto ambiental y operativo de la flota en un periodo determinado.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Consulta de indicadores por periodo
Dado un conjunto de rutas ejecutadas en el periodo seleccionado
Cuando el administrador accede al dashboard y selecciona un rango de fechas
Entonces el sistema muestra los indicadores agregados de distancia, combustible, CO2 y cumplimiento de ventanas de tiempo

Escenario: Periodo sin datos
Dado un rango de fechas sin rutas ejecutadas registradas
Cuando el usuario consulta el dashboard
Entonces el sistema muestra un estado vacío explícito en lugar de un error o pantalla en blanco
```

**US-011**
```
ID: US-011
Título: Exportación de reportes de sostenibilidad
Épica Relacionada: EP-06 Dashboard y Reportes de Sostenibilidad

Redacción:
Como administrador,
quiero exportar un reporte descargable del impacto ambiental y económico,
para compartir la información con la gerencia sin depender de una consulta en vivo al sistema.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Exportación exitosa
Dado un periodo con datos de rutas ejecutadas
Cuando el administrador solicita exportar el reporte en formato PDF o CSV
Entonces el sistema genera el archivo en menos de 10 segundos y lo pone disponible para descarga

Escenario: Exportación sin permisos
Dado un usuario con rol Conductor
Cuando intenta acceder a la función de exportación de reportes
Entonces el sistema deniega la acción y muestra un mensaje explícito de falta de autorización
```

---

## 3. Historias Técnicas (Enablers)

**ENB-01: Optimización de rendimiento del motor y la API**
```
ID: ENB-01
Título: Optimización de rendimiento del motor de rutas y la API
Épica Relacionada: Transversal (RNF-001, RNF-002, RNF-003)

Redacción:
Como equipo de desarrollo,
quiero perfilar y optimizar el motor de optimización y los endpoints críticos de la API,
para cumplir los umbrales de latencia definidos en los requisitos no funcionales.
```
- **Story Points:** 8

**Criterios de Aceptación:**
```
Escenario: Generación de rutas dentro del SLA
Dado una instancia de 150 pedidos y 15 vehículos
Cuando se ejecuta el proceso de generación de rutas en un entorno de staging
Entonces el tiempo de respuesta en el percentil 95 es menor o igual a 45 segundos

Escenario: Reporte dentro del SLA
Dado una solicitud de reporte mensual en condiciones de 80% de carga concurrente
Cuando el módulo de reportes procesa la solicitud
Entonces el tiempo de respuesta en el percentil 95 es menor o igual a 10 segundos
```

**ENB-02: Hardening de seguridad**
```
ID: ENB-02
Título: Hardening de seguridad (OWASP, cifrado, auditoría)
Épica Relacionada: Transversal (RNF-004, RNF-005, RNF-006)

Redacción:
Como equipo de desarrollo,
quiero implementar controles de seguridad contra el OWASP Top 10 y cifrado de datos personales,
para proteger la información de conductores y clientes conforme a la Ley N° 29733.
```
- **Story Points:** 8

**Criterios de Aceptación:**
```
Escenario: Bloqueo de inyección SQL
Dado un intento de inyección SQL en el endpoint de autenticación
Cuando la petición llega a la API
Entonces el sistema la bloquea, registra el evento y no ejecuta la consulta maliciosa

Escenario: Cifrado de datos personales
Dado un registro de pedido con datos personales del cliente
Cuando el dato se almacena en la base de datos
Entonces se encuentra cifrado en reposo (AES-256) y se transmite bajo TLS 1.3
```

**ENB-03: Infraestructura de alta disponibilidad**
```
ID: ENB-03
Título: Infraestructura de alta disponibilidad (failover)
Épica Relacionada: Transversal (RNF-007)

Redacción:
Como equipo de DevOps,
quiero configurar failover automático entre zonas de disponibilidad,
para cumplir el SLA de disponibilidad anual comprometido con el negocio.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Failover ante caída de nodo
Dado un nodo caído en la zona de disponibilidad primaria
Cuando el sistema de orquestación detecta la falla
Entonces conmuta automáticamente hacia la zona secundaria en un RTO menor o igual a 30 segundos

Escenario: Recuperación de datos
Dado una interrupción del servicio de base de datos primaria
Cuando el sistema conmuta a la réplica secundaria
Entonces el punto de recuperación (RPO) no supera los 5 segundos de datos perdidos
```

**ENB-04: Cumplimiento de accesibilidad WCAG 2.1 AA**
```
ID: ENB-04
Título: Cumplimiento de accesibilidad WCAG 2.1 AA
Épica Relacionada: Transversal (RNF-008)

Redacción:
Como equipo de frontend,
quiero implementar el "modo conductor" bajo el estándar WCAG 2.1 AA,
para que conductores con alfabetización digital básica puedan usar el sistema sin barreras.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Verificación automática de accesibilidad
Dado el "modo conductor" implementado
Cuando se ejecuta una herramienta de auditoría de accesibilidad (ej. Lighthouse/axe)
Entonces no se reportan incumplimientos de nivel AA

Escenario: Prueba de usabilidad con usuario representativo
Dado un conductor con alfabetización digital básica
Cuando utiliza el "modo conductor" en una prueba de usabilidad guiada
Entonces completa la tarea de visualizar su ruta asignada sin asistencia externa
```

**ENB-05: Compatibilidad multi-navegador y responsivo**
```
ID: ENB-05
Título: Compatibilidad multi-navegador y diseño responsivo
Épica Relacionada: Transversal (RNF-009)

Redacción:
Como equipo de frontend,
quiero validar la interfaz en los navegadores y resoluciones soportados,
para asegurar una experiencia consistente entre oficina y campo.
```
- **Story Points:** 3

**Criterios de Aceptación:**
```
Escenario: Renderizado correcto en navegadores soportados
Dado la interfaz desplegada en las 2 últimas versiones estables de Chrome, Firefox y Safari
Cuando un usuario navega por los módulos principales
Entonces la interfaz se renderiza sin errores visuales ni funcionales

Escenario: Diseño responsivo en móvil
Dado un dispositivo con un ancho de pantalla de 360px
Cuando el conductor accede al "modo conductor"
Entonces todos los controles permanecen visibles y usables sin scroll horizontal
```

**ENB-06: Arquitectura desacoplada del motor de optimización**
```
ID: ENB-06
Título: Arquitectura desacoplada del motor de optimización
Épica Relacionada: Transversal (RNF-010)

Redacción:
Como equipo de arquitectura,
quiero exponer el motor de optimización detrás de una interfaz de servicio desacoplada,
para poder sustituir la metaheurística sin modificar los módulos de negocio.
```
- **Story Points:** 5

**Criterios de Aceptación:**
```
Escenario: Sustitución de metaheurística sin impacto
Dado el motor de optimización implementado como servicio independiente
Cuando se reemplaza el algoritmo interno (ej. de Algoritmo Genético a Búsqueda Tabú)
Entonces los módulos de gestión de flota, pedidos e interfaz no requieren modificación

Escenario: Cobertura de pruebas del motor
Dado el módulo del motor de optimización
Cuando se ejecuta la suite de pruebas unitarias
Entonces la cobertura reportada es mayor o igual al 70%
```

**ENB-07: Modo offline-first para la app del conductor**
```
ID: ENB-07
Título: Modo offline-first para la app del conductor
Épica Relacionada: Transversal (RNF-011)

Redacción:
Como equipo de frontend móvil,
quiero que la app del conductor funcione sin conexión continua,
para que las rutas sigan disponibles en zonas con cobertura 2G/3G intermitente.
```
- **Story Points:** 8

**Criterios de Aceptación:**
```
Escenario: Continuidad de ruta sin conexión
Dado una ruta previamente sincronizada en el dispositivo del conductor
Cuando se pierde la conectividad durante al menos 60 minutos
Entonces la ruta activa permanece disponible sin interrupción

Escenario: Reintento automático de sincronización
Dado un dispositivo que recupera señal después de un corte de conectividad
Cuando la app detecta la señal disponible
Entonces reintenta la sincronización automáticamente cada 30 segundos hasta completarla
```

---

## 4. Definition of Done (DoD) Global del Proyecto

Toda Historia de Usuario o Historia Técnica se considera **"Done"** únicamente cuando cumple, como mínimo, la totalidad de los siguientes criterios:

1. **Cobertura de pruebas unitarias ≥ 80%** sobre el código nuevo o modificado.
2. **Análisis estático de código sin vulnerabilidades críticas**, verificado mediante SonarQube o CodeQL.
3. **Revisión de código (Peer Review) aprobada** por al menos un par técnico mediante Pull Request, sin comentarios bloqueantes pendientes.
4. **Despliegue automatizado ejecutable en ambiente de Staging/Pruebas**, mediante el pipeline de CI/CD del proyecto.
5. **Documentación de API/código actualizada** (especificación OpenAPI/Swagger para nuevos endpoints, o comentarios/README técnico para módulos internos).
6. Los criterios de aceptación (BDD) de la historia se ejecutan y pasan en el ambiente de Staging.
7. No se introducen regresiones detectables en las pruebas automatizadas existentes.
