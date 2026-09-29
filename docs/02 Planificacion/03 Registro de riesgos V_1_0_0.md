[← Volver al README Principal](../../README.md)

# Registro de Riesgos

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Integrantes** | Josue [Apellidos] · [Nombre integrante 2] · [Nombre integrante 3] |
| **Fecha** | 25 de agosto de 2026 |
| **Versión** | 1.0.0 |

---

## Fórmula de Cálculo

**Severidad (Exposición) = Probabilidad (1 a 5) × Impacto (1 a 5)**

- Probabilidad: 1 (Muy baja) a 5 (Muy alta)
- Impacto: 1 (Insignificante) a 5 (Catastrófico)
- Severidad: Low (1-6) · Medium (8-12) · High (15-25)

## Matriz de Evaluación de Riesgos

| ID | Descripción del Riesgo | Categoría | Prob. | Imp. | Severidad | Plan de Mitigación (Preventivo) | Plan de Contingencia (Reactivo) | Responsable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RSK-01 | El motor de optimización (VRPTW/Green VRP) no converge en el tiempo requerido (≤45 s) para instancias grandes. | Técnica / Algorítmica | 3 | 5 | 15 (High) | Realizar pruebas de rendimiento tempranas desde el Sprint 2 con instancias de 150 pedidos/15 vehículos; aplicar técnicas de poda y paralelización. | Reducir temporalmente el tamaño máximo de instancia soportado y comunicar la limitación al cliente hasta optimizar el algoritmo. | Software Architect |
| RSK-02 | Indisponibilidad o límites de cuota de las APIs externas de tráfico y mapas (Waze CCP / Google Maps). | Técnica / Infraestructura | 2 | 4 | 8 (Medium) | Monitorear el consumo de cuotas e implementar alertas de umbral al 70%; usar OpenStreetMap como fuente primaria. | Habilitar la carga manual de datos de tráfico como respaldo operativo inmediato. | DevOps Engineer |
| RSK-03 | Curva de aprendizaje elevada del equipo en librerías de optimización combinatoria (OR-Tools/DEAP). | Recursos Humanos / Capacidades | 3 | 3 | 9 (Medium) | Realizar 2 jornadas de Pair Programming y pases de conocimiento al inicio del Sprint 1. | Reasignar las tareas de mayor complejidad algorítmica al Software Architect. | Scrum Master |
| RSK-04 | Manejo inadecuado de datos personales de conductores/clientes que incumpla la Ley N° 29733. | Legal / Normativa | 2 | 5 | 10 (Medium) | Aplicar cifrado AES-256 en reposo y TLS 1.3 en tránsito desde el diseño (ENB-02); revisión legal del tratamiento de datos antes del Sprint 3. | Suspender temporalmente el módulo afectado y notificar el incidente conforme al protocolo de gestión de brechas de datos. | Security Officer / QA Engineer |
| RSK-05 | Baja adopción del "modo conductor" por parte de conductores con alfabetización digital básica. | Producto / Adopción | 3 | 3 | 9 (Medium) | Diseñar bajo WCAG 2.1 AA (ENB-04) y validar con pruebas de usabilidad reales antes del cierre del Sprint 3. | Programar sesiones de capacitación presencial adicionales para conductores con menor adopción. | UI/UX Designer |
| RSK-06 | Cambios normativos o reinterpretación del D.S. N° 033-2012-MTC (restricción vehicular) durante el desarrollo. | Legal / Normativa | 2 | 3 | 6 (Low) | Revisar boletines del MTC al inicio de cada iteración; parametrizar las reglas de restricción vehicular en tabla configurable (no hardcodeadas). | Actualizar la tabla de restricciones vehiculares sin necesidad de despliegue completo del sistema. | Backend Developer |
| RSK-07 | El cronograma académico (14 semanas) resulta insuficiente frente a la complejidad del motor Green VRP. | Cronograma | 3 | 4 | 12 (Medium) | Priorizar en el backlog una metaheurística simple (Algoritmo Genético básico) para el MVP, dejando ACO/Tabú avanzado como incremento posterior. | Reducir el alcance funcional del MVP acordando con el docente/sponsor qué RF quedan fuera de la primera entrega. | Project Manager |
| RSK-08 | Sobrecostos en infraestructura cloud por uso indebido de recursos durante pruebas de carga. | Financiero | 2 | 2 | 4 (Low) | Establecer alertas de presupuesto (budget alerts) en el proveedor cloud desde el primer despliegue. | Migrar temporalmente cargas de prueba a instancias locales/Docker hasta ajustar el uso de recursos cloud. | DevOps Engineer |

---

*Este registro debe revisarse al cierre de cada Sprint; cualquier riesgo materializado o nuevo riesgo identificado debe incorporarse a esta matriz e incrementar la versión del documento conforme a la política de control de cambios.*
