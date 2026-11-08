[← Volver al README Principal](../../../README.md)

# Informe de Reducción del Impacto Ambiental y Optimización

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_0_0
**Fecha:** 2026-10-26

## 1. Alcance y trazabilidad

Este informe adapta las recomendaciones Green IT al proyecto real Python/FastAPI, React/Vite y SQLite. Las métricas MERN, Express, MongoDB, CO₂ y Lighthouse incluidas en el archivo adjunto se usan como referencia metodológica, pero no representan mediciones reales de este repositorio. Antes de declarar resultados, deben ejecutarse Lighthouse, DevTools y mediciones comparables en el frontend local.

## 2. Optimización aplicada

1. **Código modular:** Dashboard, Pedidos, Rutas y Flota están separados en vistas independientes.
2. **Carga por demanda:** las vistas secundarias pueden dividirse mediante importaciones dinámicas de React/Vite.
3. **Contenido útil:** se evita enviar datos de demostración cuando el backend está disponible.
4. **API parametrizada:** SQLAlchemy evita consultas SQL construidas manualmente.
5. **Compilación optimizada:** Vite genera bundles minificados y aplica tree-shaking.
6. **Red de datos:** se mantienen payloads JSON pequeños y endpoints específicos por módulo.
7. **Evidencias de caché:** deben configurarse cabeceras HTTP en el despliegue y no en SQLite.
8. **Monitoreo:** CI valida pruebas, compilación y calidad antes de integrar cambios.

## 3. Métrica base verificable

| Métrica | Evidencia disponible | Estado |
|---|---|---|
| Build frontend | Vite produjo 42 módulos y un bundle principal de aproximadamente 168 KB | Verificado |
| Pruebas frontend | 41 pruebas aprobadas | Verificado |
| Pruebas backend | 115 pruebas aprobadas | Verificado |
| Lighthouse Performance | Pendiente de ejecución contra el entorno desplegado | No inventar valor |
| Peso de red | Pendiente de auditoría DevTools | No inventar valor |
| Emisiones CO₂ | Pendiente de medición por visita | No inventar valor |

## 4. Proyección Green IT

No se debe presentar una reducción ambiental cuantificada hasta tener mediciones equivalentes antes/después. El proyecto sí puede proyectar ahorros solo por transferencia, pero esa proyección requiere registros Lighthouse, tamaño transferido, visitas mensuales y modelo de carbono documentado.

## 5. Acciones siguientes

- Ejecutar Lighthouse en las vistas Login, Dashboard, Pedidos, Rutas y Flota.
- Guardar los archivos HTML/JSON generados como evidencia.
- Medir bundle, solicitudes, transferencia y latencias API antes de comparar.
- Registrar fecha, URL, navegador, red y hardware de cada medición.
- Publicar el diferencial solo cuando existan valores reproducibles.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-10-26 | Informe inicial adaptado al stack real del proyecto |

[Volver al README Principal](../../../README.md)
