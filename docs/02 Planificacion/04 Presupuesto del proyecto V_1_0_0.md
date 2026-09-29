[← Volver al README Principal](../../README.md)

# Presupuesto del Proyecto

| Campo | Detalle |
| --- | --- |
| **Proyecto** | EcoLogística Lima – Optimizador de Rutas Sostenibles |
| **Integrantes** | Josue [Apellidos] · [Nombre integrante 2] · [Nombre integrante 3] |
| **Fecha** | 25 de agosto de 2026 |
| **Versión** | 1.0.0 |

> **Nota de trazabilidad:** el Acta de Constitución (`docs/01 Inicio/02. Acta de constitución V_1_0_0.md`) presentó una **estimación preliminar (Rough Order of Magnitude)** de S/ 500,000 para el MVP. El presente documento constituye una **estimación definitiva (bottom-up)**, elaborada a partir del desglose de horas por rol durante la fase de Planificación, tal como corresponde a la elaboración progresiva del presupuesto según el PMBOK. Es normal y esperado que el monto refinado varíe frente a la estimación inicial; a un tipo de cambio referencial de S/ 3.75 por USD, el presupuesto de este documento equivale aproximadamente a S/ 368,300, dentro del rango razonable de variación de una estimación ROM inicial.

---

## 1. Costo de Recursos Humanos (CAPEX)

*Cálculo: Costo = Horas Asignadas × Tarifa Hora (USD), sobre las 14 semanas del proyecto (7 sprints de 2 semanas).*

| Rol | Horas Asignadas | Tarifa/Hora (USD) | Costo Total (USD) |
| --- | --- | --- | --- |
| Project Manager | 280 | $ 30.00 | $ 8,400.00 |
| Software Architect | 280 | $ 40.00 | $ 11,200.00 |
| Senior Developer (x2) | 980 | $ 30.00 | $ 29,400.00 |
| Junior Developer (x2) | 980 | $ 18.00 | $ 17,640.00 |
| QA Engineer | 350 | $ 22.00 | $ 7,700.00 |
| UI/UX Designer | 210 | $ 25.00 | $ 5,250.00 |
| **Subtotal CAPEX (RRHH)** | **3,080** | — | **$ 79,590.00** |

## 2. Costo de Licenciamiento y Herramientas

| Herramienta | Detalle | Costo (USD) |
| --- | --- | --- |
| Atlassian Jira Software (Standard, hasta 10 usuarios) | ~3.5 meses de proyecto | $ 75.00 |
| GitHub Team (repositorio privado + Actions CI/CD) | 6 usuarios, ~3.5 meses | $ 210.00 |
| SonarCloud (análisis estático de código) | Plan de equipo, ~3.5 meses | $ 150.00 |
| Figma Professional (1 editor) | ~3.5 meses | $ 50.00 |
| **Subtotal Licenciamiento** | | **$ 485.00** |

## 3. Costo de Infraestructura Cloud y Servicios (OPEX)

| Ítem | Detalle | Costo (USD) |
| --- | --- | --- |
| Instancias de cómputo (staging + producción) | AWS EC2 t3.medium x2, ~3.5 meses | $ 3,200.00 |
| Base de datos gestionada | Amazon RDS PostgreSQL + PostGIS | $ 2,400.00 |
| Caché gestionado | Amazon ElastiCache (Redis) | $ 900.00 |
| Almacenamiento y CDN | S3 + CloudFront | $ 600.00 |
| Dominio y certificados SSL | Registro anual + TLS gestionado | $ 150.00 |
| CI/CD adicional | Minutos adicionales de GitHub Actions | $ 350.00 |
| **Subtotal OPEX (Cloud)** | | **$ 7,600.00** |

## 4. Tabla Resumen Financiera

| Categoría | Costo Subtotal (USD) | Porcentaje del Total |
| --- | --- | --- |
| 1. Recursos Humanos (CAPEX) | $ 79,590.00 | 90.8% |
| 2. Licenciamiento de Software | $ 485.00 | 0.6% |
| 3. Infraestructura Cloud (OPEX) | $ 7,600.00 | 8.7% |
| **SUBTOTAL DE PROYECTO** | **$ 87,675.00** | **100.0%** |
| 4. Reserva de Contingencia (12%) | $ 10,521.00 | N/A |
| **PRESUPUESTO TOTAL ESTIMADO** | **$ 98,196.00** | **100.0%** |

---

## 5. Justificación de la Reserva de Contingencia

Se asigna una **reserva de contingencia del 12%** sobre el subtotal del proyecto, dentro del rango sugerido (10%-15%). Este porcentaje se sustenta directamente en el Registro de Riesgos (`03 Registro de riesgos V_1_0_0.md`), donde los riesgos RSK-01 (motor de optimización, severidad High) y RSK-07 (insuficiencia de cronograma, severidad Medium-Alta) representan las mayores amenazas de sobrecosto por retrabajo técnico y extensión de horas de desarrollo, justificando un margen superior al mínimo del rango sugerido.
