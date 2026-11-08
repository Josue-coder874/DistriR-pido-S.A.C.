[← Volver al README Principal](../../../README.md)

# Evaluación de Calidad de Código — SonarQube

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Fecha de Análisis:** 2026-11-08
**Versión del Análisis:** V_1_0_0

## 1. Resumen Ejecutivo de Quality Gate

- **Estado del Quality Gate:** Bajo revisión
- **Cobertura de pruebas:** 115 pruebas backend y 41 pruebas frontend ejecutadas correctamente. El porcentaje Cloud no estaba publicado al 2026-11-08.
- **Duplicación de código:** Pendiente de medición por SonarCloud.

## 2. Métricas Principales

| Categoría | Cantidad Detectada | Severidad |
|---|---:|---|
| Bugs | Pendiente de SonarCloud | Por determinar |
| Vulnerabilidades | Pendiente de SonarCloud | Por determinar |
| Code Smells | Pendiente de SonarCloud | Por determinar |
| Security Hotspots | Pendiente de SonarCloud | Por determinar |

## 3. Plan de Remediación y Deuda Técnica

- **Deuda técnica estimada:** 4 horas al cierre inicial; depende de los resultados publicados por SonarCloud.
- Configurar el proyecto en SonarCloud y cargar el reporte LCOV/JUnit de las pruebas.
- Corregir primero vulnerabilidades críticas y bugs bloqueantes.
- Reducir duplicación en los componentes React de administración y rutas.
- Ejecutar nuevamente CI y publicar métricas en el Pull Request.

## Evidencia local

Backend, frontend y build fueron validados antes de este reporte. El workflow CodeQL se agregó al repositorio; SonarCloud requiere configuración externa del token y organización.

[Volver al README Principal](../../../README.md)
