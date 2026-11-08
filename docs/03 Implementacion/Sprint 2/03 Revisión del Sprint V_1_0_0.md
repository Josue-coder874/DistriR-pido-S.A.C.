[← Volver al README Principal](../../../README.md)

# Revisión del Sprint — Sprint 2

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Sprint** | Sprint 2 · del 2026-09-28 al 2026-10-09 |
| **Fecha de la reunión** | Pendiente de registrar en el acta final de Sprint Review |
| **Asistentes** | Equipo del proyecto; Product Owner y stakeholders invitados mediante la sesión de revisión |
| **Estado del documento** | Documento final de revisión con campos organizativos pendientes de acta |
| **Versión** | 1.0.0 |
| **Estado Jira** | Las 18 actividades LD-9 a LD-26 están en estado Listo |
| **Responsable Jira aplicado** | Josue Gonzales Silupu |
| **Fecha de vencimiento aplicada** | 2026-10-09 |

---

## 1. Incremento a demostrar

| Ítem | Qué se muestra |
| --- | --- |
| US-001 Inicio de sesión | Ingreso con correo y contraseña, bloqueo tras 3 intentos fallidos y recuperación de contraseña. |
| US-002 Control de acceso por rol | El mismo sistema visto por Administrador, Despachador, Auditor y Conductor. |
| US-003 Gestión de flota | Alta, edición, cambio de estado y baja de vehículos; rechazo de placa duplicada. |
| US-007 Generación de rutas (avance) | Ruta optimizada con OR-Tools e indicadores de distancia, tiempo, costo (RN-006) y CO₂ (RN-007) según el vehículo elegido. |
| Tarea técnica | "Limpiar clientes" para reiniciar las simulaciones. |

## 2. Guion de demostración

**Preparación:** crea un usuario por rol con `python -m scripts.create_user`, arranca el backend y el frontend, y verifica los datos de prueba antes de la presentación.

| # | Paso | Resultado esperado |
| ---: | --- | --- |
| 1 | Iniciar sesión como Administrador. | Se abre el "Planificador de rutas" con el nombre y el rol en la cabecera. |
| 2 | Registrar el vehículo `ABC-123`, 1000 kg, diésel, sin factor de emisión manual. | El vehículo queda activo con 0.27 kg CO₂/km. |
| 3 | Registrar nuevamente `abc123`. | La API rechaza la placa duplicada con código 409. |
| 4 | Registrar clientes con coordenadas negativas de Lima. | Aparecen en la lista de clientes. |
| 5 | Elegir `ABC-123` y pulsar **Optimizar ruta**. | Se muestra una ruta ordenada con distancia, tiempo, costo y CO₂. |
| 6 | Cambiar el estado del vehículo a **En mantenimiento**. | El vehículo deja de estar disponible para nuevas rutas. |
| 7 | Entrar como Despachador. | Puede optimizar rutas y gestionar clientes, con flota en solo lectura. |
| 8 | Entrar como Auditor. | Tiene acceso de solo lectura. |
| 9 | Entrar como Conductor. | Se abre el panel correspondiente a su ruta. |
| 10 | Ingresar tres contraseñas incorrectas. | Al tercer intento la cuenta se bloquea por 15 minutos. |
| 11 | Solicitar recuperación de contraseña y abrir el enlace generado por el backend. | Se permite definir una nueva contraseña y desbloquear la cuenta. |
| 12 | Como Administrador, pulsar **Limpiar clientes** y confirmar. | La lista y los indicadores vuelven a cero. |

## 3. Resultado por ítem

| Ítem | SP | Estado al presentar | Aceptación de los stakeholders | Observaciones |
| --- | ---: | --- | --- | --- |
| US-001 Inicio de sesión | 3 | Completa (funcional) | Pendiente de acta formal | Sin SMTP, el enlace de recuperación se toma del log del backend. |
| US-002 Control de acceso por rol | 5 | Completa (funcional) | Pendiente de acta formal | Aplica en clientes, flota y rutas. |
| US-003 Gestión de flota | 3 | Completa (funcional) | Pendiente de acta formal | El consumo de combustible depende del tipo de combustible, no de cada vehículo. |
| US-007 Generación de rutas | 13 | En progreso | No presentado para aceptación | Un solo vehículo; faltan capacidad, pico y placa y prueba de rendimiento. |

Ninguna historia cumple todavía la Definition of Done completa: faltan Peer Review, CI/CD y Staging. Ver la sección 5 del [Informe de Estado del Sprint 2](01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md).

## 4. Retroalimentación de los stakeholders

La retroalimentación se registrará en el acta de la reunión y se incorporará al backlog antes del Sprint 3. Los aspectos previstos son la precisión de los parámetros de costo/emisiones, el alcance del motor con varios vehículos y la experiencia de los roles de operación.

## 5. Decisiones que se deben tomar en la reunión

1. Aprobar o sustituir los precios de combustible, consumos y factores de emisión estimados por datos reales.
2. Confirmar si "Limpiar clientes" debe seguir siendo exclusivo del Administrador.
3. Confirmar que SQLite seguirá siendo la base oficial del MVP y documentar su ubicación y respaldo local.
4. Decidir si se mantiene la autenticación propia o se integra el proveedor OAuth2 planteado en el Modelo C4.
5. Registrar la decisión de cada punto en el acta de Sprint Review.

## 6. Ajustes propuestos al backlog

- Priorizar US-005 (pedidos con ventana de tiempo), prerrequisito de RN-004.
- Dividir US-007 en varias historias: varios vehículos, capacidad, pico y placa y rendimiento.
- Agregar una historia de gestión de usuarios, porque hoy se crean desde terminal.
- Agregar las tareas técnicas de inicialización Git y pipeline CI/CD.

Los ajustes definitivos se incorporarán al backlog tras la aprobación del Product Owner en la reunión.

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-10-06 | Versión inicial de la Revisión del Sprint 2, con incremento, guion de demostración, pendientes y ajustes propuestos. |

[Volver al README](../../../README.md)
