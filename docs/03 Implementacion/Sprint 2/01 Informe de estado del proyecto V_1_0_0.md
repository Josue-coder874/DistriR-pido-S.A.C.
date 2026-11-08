[← Volver al README Principal](../../../README.md)

# Informe de Estado del Proyecto — Sprint 2

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Equipo** | Josue Gonzales Silupu (Scrum Master) · Nayely Cuicapuza Remigio (Backend) · Esau Landeon Arrellano (Frontend) |
| **Sprint** | Sprint 2 · del 2026-09-28 al 2026-10-09 (cadencia de 2 semanas, fecha registrada en el plan del proyecto) |
| **Fecha de corte** | 2026-10-06 |
| **Estado del Sprint** | Cerrado; las 18 actividades verificadas de Jira están en estado Listo |
| **Responsable registrado en Jira** | Josue Gonzales Silupu |
| **Fecha de vencimiento aplicada en Jira** | 2026-10-09 |
| **Versión** | 1.0.0 |

---

## 1. Resumen ejecutivo

Al 2026-10-06 el Sprint 2 tiene **tres historias funcionalmente completas**: inicio de sesión (US-001), control de acceso por rol (US-002) y gestión de flota (US-003), que suman 11 Story Points. El motor de rutas (US-007) ya usa **Google OR-Tools** con distancias geográficas reales y calcula costo (RN-006) y emisiones de CO₂ (RN-007), pero todavía trabaja con un solo vehículo.

El proyecto pasó de no tener pruebas automatizadas a tener **156 pruebas** (115 de backend y 41 de frontend), con una cobertura del 95% en el backend y del 94.6% en el frontend.

Ninguna historia cumple todavía la Definition of Done completa. Faltan los criterios que dependen de infraestructura que el proyecto aún no tiene: control de versiones con Pull Requests, análisis estático, CI/CD y ambiente de Staging (ver sección 5).

## 2. Objetivo del Sprint

Implementar y demostrar el núcleo de autenticación, autorización por roles, gestión de flota y el primer incremento de optimización de rutas, aumentando la calidad mediante pruebas automatizadas y evidencias trazables.

## 3. Avance por ítem del backlog

| ID | Ítem | SP | Estado | Criterios de aceptación | Evidencia |
| --- | --- | ---: | --- | --- | --- |
| US-001 | Inicio de sesión con credenciales (RF-001) | 3 | Completa (funcional) | Ruta Gold: token de sesión y panel según el rol. Ruta Feliz: enlace de recuperación válido por 30 minutos. Ruta Infeliz: bloqueo de 15 minutos tras 3 intentos fallidos (RN-001), con el tiempo restante. | `app/services/auth_service.py`, `app/api/auth_routes.py`, `src/components/LoginPage.jsx`, `tests/test_auth.py` |
| US-002 | Control de acceso según rol (RF-010) | 5 | Completa (funcional) | Matriz RBAC aplicada en la API (403) y en la interfaz. El Auditor tiene solo lectura (RN-010). Cada acceso denegado se registra en el log de auditoría. El Conductor accede a su propio panel. | `app/security.py`, `tests/test_rbac.py`, `src/Root.test.jsx` |
| US-003 | Registro de vehículos de la flota (RF-002) | 3 | Completa (funcional) | Ruta Gold: alta en estado ACTIVO. Ruta Feliz: un vehículo en mantenimiento queda excluido de las rutas. Ruta Infeliz: se rechaza la placa duplicada (409). Incluye edición y baja lógica. | `app/api/routes.py`, `src/components/FleetPanel.jsx`, `tests/test_vehicles.py` |
| US-007 | Generación automática de rutas óptimas (RF-005) | 13 | Listo en Jira; incremento parcial en el producto | Implementado: OR-Tools con distancia Haversine, prioridad de clientes, costo RN-006 y CO₂ RN-007 por vehículo. Pendiente técnico: varios vehículos, pedidos con ventanas, capacidad, pico y placa y prueba formal de 150 pedidos/15 vehículos. | `app/services/routing_service.py`, LD-15 |
| ENB-02 | Hardening de seguridad (RNF-004 a RNF-006) | 8 | Listo en Jira; cumplimiento técnico parcial | Implementado: Argon2, consultas parametrizadas y auditoría. Pendientes técnicos: cifrado en reposo, TLS y revisión completa OWASP. | `tests/test_auth.py`, LD-21 |
| ENB-06 | Arquitectura desacoplada del motor (RNF-010) | 5 | Listo en Jira; implementación verificable parcialmente | El motor se expone mediante `RoutingService.optimize`. Falta desacoplar por completo los factores de emisión desde los módulos de flota. | `app/services/routing_service.py`, `app/crud.py`, LD-25 |

**Tareas técnicas del sprint, sin ítem en el backlog:**

- **"Limpiar clientes":** botón para reiniciar las simulaciones de ruta, exclusivo del Administrador.
- **Integración frontend-backend:** el frontend ya no muestra datos de demostración cuando la API responde con una lista vacía, y muestra los errores de la API en lugar de ocultarlos.
- **Configuración:** se creó `.env.example` y el backend lee el archivo `.env`.
- **Usuarios:** script `scripts/create_user.py` para crear usuarios desde la terminal.

## 4. Métricas del Sprint

| Métrica | Sprint 1 | Sprint 2 (corte 2026-10-06) |
| --- | --- | --- |
| Story Points comprometidos | 21 | Pendiente de exportar desde Jira |
| Story Points funcionalmente completos | 0 | 11 (US-001, US-002, US-003) |
| Story Points en progreso | 21 (parciales) | 26 (US-007, ENB-02, ENB-06) |
| Endpoints de la API | 3 | 12 |
| Pruebas automatizadas (backend / frontend) | 0 / 0 | 115 / 41 |
| Cobertura de líneas (backend / frontend) | No medida | 95% / 94.6% |

Cobertura medida el 2026-10-06 con `pytest --cov=app` y `vitest --coverage` (V8). El valor más bajo es el del servicio de correo (26%), porque el envío por SMTP no se prueba sin un servidor de correo.

## 5. Cumplimiento de la Definition of Done

| # | Criterio de la DoD | Estado | Observación |
| ---: | --- | --- | --- |
| 1 | Cobertura de pruebas unitarias ≥ 80% | Cumple | 95% en el backend y 94.6% en el frontend. |
| 2 | Análisis estático sin vulnerabilidades críticas (SonarQube o CodeQL) | Parcial | Se agregó un workflow CodeQL para Python y JavaScript. Queda pendiente publicar y validar el resultado en GitHub. |
| 3 | Peer Review aprobado mediante Pull Request | Parcial | El repositorio Git local fue inicializado. Falta publicar el remoto y aprobar Pull Requests. |
| 4 | Despliegue automatizado en Staging (CI/CD) | Parcial | Existe workflow GitHub Actions para backend, frontend y build; falta el ambiente de Staging y el despliegue automatizado. |
| 5 | Documentación de API o código actualizada | Cumple | FastAPI publica la especificación OpenAPI en `/docs`. README con instalación, creación de usuarios y pruebas. |
| 6 | Criterios BDD ejecutados en Staging | Parcial | Las pruebas tienen criterios automatizados, pero se ejecutan localmente, no en Staging. |
| 7 | Sin regresiones en pruebas existentes | Cumple | Las 156 pruebas pasan. |

## 6. Decisiones técnicas y supuestos por validar

| Tema | Decisión o supuesto | Origen | Validar con |
| --- | --- | --- | --- |
| Precio del combustible | Diésel S/ 17.50 por galón; gasolina S/ 16.00 por galón; GLP S/ 2.10 por litro; GNV S/ 1.90 por m³ | Diésel: supuesto A-05. Los demás son estimados. | Osinergmin |
| Consumo y emisiones | Diésel 0.10 L/km y 0.27 kg CO₂/km (factores de referencia por tipo de combustible) | Estimados (rendimiento típico × factor IPCC) | Datos reales de la flota |
| Consumo por vehículo | El costo de combustible depende del tipo de combustible, no de cada vehículo | El modelo de datos `vehiculo` no tiene un campo de consumo | Equipo y Product Owner |
| Tiempo de ruta | 25 km/h promedio y 10 minutos de atención por parada | Estimados | Datos históricos (supuesto A-01) |
| Prioridad en el ruteo | Penalidad de 1 km por cada posición de atraso respecto a la prioridad | Decisión técnica | Product Owner |
| Eliminación de clientes | "Limpiar clientes" es exclusivo del Administrador | Matriz RBAC: "Depuración / eliminación física de registros" | Product Owner |
| Modelo de roles | El rol es un campo de `users` y no una tabla `rol` separada | Simplificación del modelo de datos | Equipo |
| Sesión | Token JWT con 8 horas de vigencia, guardado en `sessionStorage` | Decisión técnica | Equipo (revisión de seguridad) |

## 7. Desviaciones respecto a la planificación

| Planificado | Implementado | Impacto |
| --- | --- | --- |
| PostgreSQL 16 con PostGIS (Docker Compose) | SQLite | Decisión acordada para el MVP: SQLite elimina dependencias externas y mantiene persistencia real mediante `app.db`. Las tablas se crean al iniciar la aplicación. |
| Caché de sesión con Redis | Tokens JWT sin estado | No hay revocación centralizada. Cambiar la contraseña o desactivar al usuario sí invalida sus tokens. |
| Proveedor de identidad OAuth2 (Modelo C4) | Autenticación propia con correo y contraseña | Se debe decidir si se mantiene o se integra un proveedor externo. |
| Envío de correos | Correo en el log del backend si no hay SMTP | La recuperación de contraseña funciona, pero el enlace no llega a un buzón real. |

## 8. Estado de los riesgos

| Riesgo | Situación al 2026-10-06 |
| --- | --- |
| RSK-01 Motor no converge en ≤ 45 s | Activo, sin medir formalmente. En una medición manual, el motor resolvió 30 paradas en unos 1 s con un solo vehículo. La prueba de rendimiento con 150 pedidos y 15 vehículos, prevista desde el Sprint 2, sigue pendiente. |
| RSK-03 Curva de aprendizaje de OR-Tools | Mitigado parcialmente: OR-Tools está integrado y probado. Falta el modelo con varios vehículos y ventanas de tiempo. |
| RSK-04 Datos personales y Ley N° 29733 | Activo: las contraseñas se guardan con hash, pero los datos de clientes no están cifrados en reposo y no hay TLS configurado. |
| RSK-07 Cronograma insuficiente | Activo: US-007 (13 SP) sigue en progreso y es el ítem de mayor peso del backlog. |
| Nuevo: falta de control de versiones | Sin historial ni Peer Review, y el riesgo de perder cambios es alto. Se propone incorporarlo al Registro de Riesgos. |

## 9. Próximos pasos

1. Inicializar el repositorio git y trabajar con Pull Requests para cumplir el criterio 3 de la DoD.
2. Completar US-007: varios vehículos, capacidad (RN-004) y pico y placa (RN-002), y ejecutar la prueba de rendimiento de RSK-01.
3. Implementar US-005 (pedidos con ventana de tiempo), prerrequisito de las ventanas en el motor y de RN-004.
4. Validar con el Product Owner los supuestos de la sección 6.
5. Configurar CI con pruebas y análisis estático (criterios 2 y 4 de la DoD).

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-10-06 | Versión inicial del Informe de Estado del Sprint 2, con corte al 2026-10-06. |

[Volver al README](../../../README.md)
