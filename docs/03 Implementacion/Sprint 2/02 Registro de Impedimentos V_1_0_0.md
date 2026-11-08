[← Volver al README Principal](../../../README.md)

# Registro de Impedimentos — Sprint 2

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Líder del Proyecto** | Josue Gonzales Silupu |
| **Sprint** | Sprint 2 · del 2026-09-28 al 2026-10-09 |
| **Fecha de corte** | 2026-10-06 |
| **Versión** | 1.0.0 |

---

La numeración continúa la del [Registro de Impedimentos del Sprint 1](../Sprint%201/02%20Registro%20de%20Impedimentos%20V_1_1_0.md). Los impedimentos #3 y #4 vienen de ese sprint.

Las fechas propuestas corresponden al cierre del Sprint 2 o al Sprint 3. Los responsables operativos serán asignados por el Scrum Master y el equipo durante la planificación de la próxima iteración.

| Impedimento # | Fecha de Registro | Descripción del Impedimento y su impacto en el proyecto | Prioridad | Reportado por | Fecha tope de Resolución | Estado | Fecha de Resolución | Resolución / Comentarios |
|---:|---|---|---|---|---|---|---|---|
| 3 | 2026-09-21 | La lógica de optimización requiere un análisis más profundo de restricciones reales del negocio, lo que puede afectar tiempos de desarrollo del algoritmo. | Alta | Esau Landeon Arrellano | 2026-10-09 | Resuelto parcialmente | - | Se integró OR-Tools con distancias reales, prioridad, costo (RN-006) y CO₂ (RN-007). Siguen pendientes las restricciones que dependen de otros módulos: capacidad (RN-004, requiere pedidos con peso) y pico y placa (RN-002). Responsable de seguimiento: Equipo backend. |
| 4 | 2026-09-23 | Falta de integración funcional entre el frontend y el backend, lo que retrasa la validación end-to-end. | Media | Esau Landeon Arrellano | 2026-09-27 | Resuelto | 2026-10-06 | El frontend consume clientes, flota, rutas y autenticación de la API real, con sesión y mensajes de error. La integración se valida con pruebas automatizadas y una prueba contra el servidor en ejecución. Responsables: Equipo frontend y backend. |
| 5 | 2026-10-06 | No había control de versiones Git en la copia de trabajo: no existía historial de cambios ni Pull Requests, por lo que no se podía cumplir el Peer Review de la DoD ni establecer trazabilidad. | Alta | Equipo de desarrollo | 2026-10-09 | En proceso | - | Inicializar el repositorio Git, registrar el estado inicial y integrar los cambios mediante Pull Requests. Responsable: Líder del proyecto. |
| 6 | 2026-10-06 | El diseño inicial proponía PostgreSQL/PostGIS, pero el entorno del MVP debía ejecutarse sin infraestructura externa adicional. | Media | Equipo de desarrollo | 2026-10-09 | Resuelto | 2026-10-06 | PostgreSQL/PostGIS no se implementará para el MVP acordado; SQLite es la base oficial y persistente del proyecto. Responsable: Equipo backend. |
| 7 | 2026-10-06 | No hay un servidor SMTP disponible: los correos de recuperación de contraseña se muestran en el log del backend y no llegan al usuario. | Media | Equipo de desarrollo | Sprint 3 | Abierto (con solución temporal) | - | Solución temporal: el enlace se toma del log del backend. Solución definitiva: configurar las variables `SMTP_*` en `.env` con un proveedor de correo. Responsable: Equipo backend. |
| 8 | 2026-10-06 | La documentación solo define el precio del diésel y el mantenimiento. Los precios de otros combustibles, los consumos y los factores de emisión se estimaron, lo que afecta RN-006 y RN-007. | Media | Equipo de desarrollo | 2026-10-09 | Abierto | - | Validar con el Product Owner y Osinergmin los valores de costo y emisiones antes de usarlos como datos oficiales. Responsable: Líder del proyecto. |
| 9 | 2026-10-06 | Podían existir datos de prueba inconsistentes en `app.db`, como coordenadas o factores de emisión fuera de Lima y de rangos plausibles, lo que distorsiona las demostraciones. | Baja | Equipo de desarrollo | 2026-10-09 | En proceso | - | Verificar y normalizar los datos antes de la Revisión del Sprint; excluir los datos locales de la entrega mediante `.gitignore`. Responsable: Equipo backend. |
| 10 | 2026-10-06 | No había pipeline de CI/CD ni análisis estático configurado. | Alta | Equipo de desarrollo | Sprint 3 | Resuelto parcialmente | - | Se configuraron workflows GitHub Actions para pruebas backend/frontend, build y CodeQL. Falta publicar el repositorio remoto y validar las ejecuciones, además de preparar Staging. Responsable: Líder del proyecto. |

## Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| 1.0.0 | 2026-10-06 | Versión inicial del Registro de Impedimentos del Sprint 2: seguimiento de los #3 y #4 y registro de los #5 a #10. |

[Volver al README](../../../README.md)
