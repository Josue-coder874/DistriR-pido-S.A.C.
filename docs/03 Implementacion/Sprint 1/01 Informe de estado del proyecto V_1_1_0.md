[← Volver al README Principal](../../../README.md)

# Informe de Estado del Proyecto — Sprint 1

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Equipo** | Josue Gonzales Silupu (Scrum Master) · Nayely Cuicapuza Remigio (Backend) · Esau Landeon Arrellano (Frontend) |
| **Sprint** | Sprint 1 · del 2026-09-14 al 2026-09-25 |
| **Estado del Sprint** | Cerrado |
| **Versión** | 1.1.0 |

---

## 1. Resumen ejecutivo

El Sprint 1 entregó la **base técnica del sistema**: un repositorio organizado por frontend y backend, una API FastAPI con registro y listado de clientes, un algoritmo base de ordenamiento de paradas y un panel web en React que consume la API (con datos de demostración si la API no responde).

Ningún ítem del backlog cumplió la Definition of Done al cierre del sprint. El trabajo entregado avanza parcialmente en **US-005**, **US-007** y **ENB-06**. La visualización en mapa (US-009) y el entorno con Docker Compose y PostgreSQL/PostGIS no llegaron a implementarse y se trasladan al backlog.

## 2. Objetivo del Sprint

[COMPLETAR: Sprint Goal registrado en Jira para el Sprint 1.]

## 3. Avance por ítem del backlog

La versión 1.0.0 de este informe listaba el trabajo con identificadores propios (HU-01 a HU-05) que no existen en el backlog del proyecto (`01 Transformando a ágil`). La siguiente tabla los vincula con los ítems oficiales y registra su estado real según el código del repositorio al cierre del sprint.

| ID original | Trabajo reportado | Ítem del backlog | SP | Estado al cierre | Evidencia en el repositorio |
| --- | --- | --- | ---: | --- | --- |
| HU-01 | Registro de clientes y puntos de entrega | US-005 Registro de pedidos con ventana de tiempo | 3 | Parcial | `POST/GET /api/customers` con nombre, dirección, coordenadas y prioridad. Sin ventanas de tiempo, edición ni baja. |
| HU-02 | Definición de rutas y secuencia de visitas por zona | US-007 Generación automática de rutas óptimas | 13 | Parcial | `routing_service.py` ordena las paradas por prioridad. No agrupa por zonas ni optimiza distancias. |
| HU-03 | Plan de distribución con costo y tiempo estimado | US-007 (mismo ítem) | — | Parcial | Distancia aproximada con la diferencia de latitudes × 100; tiempo de 18 min por parada; costo de S/ 1.80 por km. Fórmulas provisionales. |
| HU-04 | Visualización básica del mapa de rutas | US-009 Visualización de ruta asignada en mapa | 5 | No iniciado | El panel muestra la ruta como lista numerada; no hay mapa ni Leaflet en el proyecto. |
| HU-05 | Entorno de desarrollo y despliegue local con Docker | Sin ítem en el backlog (tarea técnica) | — | Parcial | Instalación local documentada (entorno virtual de Python y npm). No existe `docker-compose.yml`; la base de datos es SQLite (`app.db`). |
| — | Motor en un servicio separado | ENB-06 Arquitectura desacoplada del motor | 5 | Parcial | El cálculo de rutas vive en `RoutingService`, separado de los endpoints. Sin pruebas ni sustitución de algoritmo demostrada. |

## 4. Métricas del Sprint

| Métrica | Valor |
| --- | --- |
| Story Points comprometidos | [COMPLETAR desde Jira] |
| Story Points completados según la DoD | 0 |
| Ítems con avance parcial | 3 (US-005, US-007, ENB-06) |
| Endpoints de la API | 3 (`GET /api/customers`, `POST /api/customers`, `POST /api/routes/optimize`) |
| Pruebas automatizadas | 0 |
| Cobertura de pruebas | No medida |

## 5. Cumplimiento de la Definition of Done

| # | Criterio de la DoD | Estado | Observación |
| ---: | --- | --- | --- |
| 1 | Cobertura de pruebas unitarias ≥ 80% | No cumple | No había pruebas automatizadas. |
| 2 | Análisis estático sin vulnerabilidades críticas (SonarQube o CodeQL) | No cumple | No configurado. |
| 3 | Peer Review aprobado mediante Pull Request | No cumple | No hay evidencia de Pull Requests. |
| 4 | Despliegue automatizado en Staging (CI/CD) | No cumple | No hay pipeline de CI/CD. |
| 5 | Documentación de API o código actualizada | Parcial | README por módulo; FastAPI genera la especificación OpenAPI en `/docs`. |
| 6 | Criterios BDD ejecutados en Staging | No cumple | No hay ambiente de Staging. |
| 7 | Sin regresiones en pruebas existentes | No aplica | No había pruebas existentes. |

## 6. Desviaciones respecto a la planificación

| Planificado (documentos de Inicio) | Implementado | Impacto |
| --- | --- | --- |
| PostgreSQL 16 con PostGIS, levantado con Docker Compose | SQLite local (`app.db`) | Sin consultas geoespaciales; el README indica `docker compose up -d`, pero el archivo no existe. |
| Motor de optimización con OR-Tools | Ordenamiento por prioridad | La ruta no minimiza distancia, costo ni emisiones. |
| Mapa interactivo con Leaflet y OpenStreetMap | Lista de paradas | US-009 sin avance. |
| Configuración por variables de entorno (`.env.example`) | `config.py` definido pero sin uso; no existe `.env.example` | La configuración está dispersa en el código. |

## 7. Estado de los riesgos

| Riesgo | Situación al cierre del Sprint 1 |
| --- | --- |
| RSK-01 Motor no converge en ≤ 45 s | Sin evaluar: el motor aún no optimiza. |
| RSK-03 Curva de aprendizaje de OR-Tools | Activo: OR-Tools todavía no se integró. |
| RSK-07 Cronograma insuficiente | Activo: el ítem de mayor peso (US-007, 13 SP) solo tiene una versión provisional. |
| RSK-02, RSK-04, RSK-05, RSK-06, RSK-08 | Sin cambios: los módulos relacionados aún no se implementan. |

## 8. Pendientes trasladados al Sprint 2

- Integrar un motor de optimización real (OR-Tools) con distancias geográficas.
- Implementar las reglas de costo (RN-006) y de emisiones de CO₂ (RN-007).
- Completar la integración entre el frontend y el backend con manejo de errores de la API.
- Implementar la autenticación (US-001) y el control de acceso por rol (US-002), prerrequisitos del resto de módulos.
- Implementar la gestión de flota (US-003).
- Crear las pruebas automatizadas de backend y frontend.
- Definir si se implementa Docker Compose con PostgreSQL/PostGIS o se ajusta la planificación del stack.

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-09-29 | Versión inicial del Informe de Estado del Sprint 1. |
| 1.1.0 | 2026-10-06 | Trazabilidad con el backlog (US/ENB y Story Points); corrección del estado de HU-04 (mapa) y HU-05 (Docker Compose/PostGIS) según el repositorio; nuevas secciones de métricas, DoD, desviaciones y riesgos. |

[Volver al README](../../../README.md)
