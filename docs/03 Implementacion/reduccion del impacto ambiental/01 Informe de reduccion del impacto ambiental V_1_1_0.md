[← Volver al README Principal](../../../README.md)

# Informe de Reducción del Impacto Ambiental y Optimización

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_1_0
**Fecha:** 2026-11-10

## 1. Alcance y trazabilidad

Este informe adapta las recomendaciones Green IT al proyecto real Python/FastAPI, React/Vite y SQLite. Las métricas MERN, Express, MongoDB, CO₂ y Lighthouse incluidas en la rúbrica se usan como referencia metodológica. Los resultados Lighthouse registrados abajo son mediciones locales del build de producción y no equivalen a una ejecución en infraestructura de producción.

## 2. Optimización aplicada

1. **Código modular:** Dashboard, Pedidos, Rutas y Flota están separados en vistas independientes.
2. **Carga por demanda:** Dashboard, Pedidos, Rutas y los módulos autenticados de administración/conductor se cargan mediante importaciones dinámicas de React/Vite.
3. **Contenido útil:** se evita enviar datos de demostración cuando el backend está disponible.
4. **API parametrizada:** SQLAlchemy evita consultas SQL construidas manualmente.
5. **Compilación optimizada:** Vite genera bundles minificados y aplica tree-shaking.
6. **Red de datos:** se mantienen payloads JSON pequeños y endpoints específicos por módulo.
7. **Evidencias de caché:** deben configurarse cabeceras HTTP en el despliegue y no en SQLite.
8. **Monitoreo:** CI valida pruebas, compilación y calidad antes de integrar cambios.

## 3. Métrica base verificable

| Métrica | Evidencia disponible | Estado |
|---|---|---|
| Build frontend | Vite produjo 28 módulos; bundle inicial principal de 149.89 KB (49.07 KB gzip) luego de dividir módulos autenticados | Verificado localmente |
| Pruebas frontend | 85 pruebas aprobadas | Verificado localmente |
| Pruebas backend | 144 pruebas aprobadas | Verificado localmente |
| Lighthouse Performance | Mediana 100/100 en tres auditorías móviles de la pantalla inicial | Verificado localmente; falta repetir en CI |
| Peso transferido | Mediana de 54,578 bytes para la pantalla inicial del build local | Verificado localmente; no es una medición de toda la aplicación autenticada |
| Emisiones CO₂ | Pendiente de medición por visita | Verificado localmente |

## 4. Línea base Lighthouse y primera mejora

Se midió el build de producción servido localmente con Lighthouse CI 0.15.1 y Lighthouse 12.6.1, Chrome Headless 157 sobre Windows, configuración predeterminada móvil y tres ejecuciones por estado. La URL auditada es únicamente la pantalla inicial sin autenticar (`/`); no incluye el backend ni las pantallas posteriores al inicio de sesión. Los valores son medianas salvo que se indique lo contrario.

| Métrica | Antes de dividir módulos autenticados | Después | Umbral de la rúbrica | Resultado |
|---|---:|---:|---:|---|
| Lighthouse Performance | 100/100 | 100/100 | ≥ 90 | Cumple en la muestra local |
| First Contentful Paint (FCP) | 1,312 ms | 1,260 ms | ≤ 1,000 ms | Cumple en la muestra local |
| Largest Contentful Paint (LCP) | 1,312 ms | 1,260 ms | ≤ 1,400 ms | Cumple en la muestra local |
| Total Blocking Time (TBT) | 5 ms | 0 ms | ≤ 85 ms | Cumple en la muestra local |
| Cumulative Layout Shift (CLS) | 0.000 | 0.000 | ≤ 0.02 | Cumple en la muestra local |
| Transferencia total | 59,104 bytes | 54,578 bytes | ≤ 1,100,000 bytes | Cumple en la muestra local |

La mejora de carga diferida redujo el bundle JavaScript inicial de 166.74 KB (53.36 KB gzip) a 149.89 KB (49.07 KB gzip), y la transferencia observada en la ruta inicial en 4,526 bytes. El FCP mejoró aproximadamente 52 ms, pero todavía supera el máximo de la rúbrica en unos 260 ms. Aunque la categoría Performance obtiene 100/100, eso no implica que se cumpla el umbral independiente de FCP.

El workflow `.github/workflows/green-audit.yml` ejecuta la misma configuración móvil tres veces, falla si no se cumple cualquiera de los seis umbrales y guarda los reportes como artefacto de la ejecución de GitHub Actions por 14 días. El acceso al artefacto depende de los permisos y la visibilidad del repositorio. La auditoría local confirmó las aserciones de LCP, TBT, CLS, transferencia y Performance; FCP falla, por lo que la comprobación completa no está aprobada. Aún falta una ejecución remota de GitHub Actions.

## 5. Proyección Green IT

No se debe presentar una reducción ambiental cuantificada hasta tener mediciones equivalentes antes/después. El proyecto sí puede proyectar ahorros solo por transferencia, pero esa proyección requiere registros Lighthouse, tamaño transferido, visitas mensuales y modelo de carbono documentado.

## 6. Acciones siguientes

- Reducir el FCP móvil de la pantalla inicial a 1,000 ms o menos sin ocultar ni sustituir contenido visible.
- Ejecutar Lighthouse en las vistas Login, Dashboard, Pedidos, Rutas y Flota; las pantallas autenticadas requieren un recorrido de prueba con credenciales no productivas.
- Revisar si la mejora propuesta reduce trabajo o transferencia en las pantallas después del login y medir bundle, solicitudes y latencias de API.
- Descargar el artefacto de GitHub Actions para conservar el HTML/JSON de cada ejecución fuera de la retención del workflow.
- Registrar fecha, URL, navegador, red y hardware de cada medición.
- Calcular energía y emisiones solo después de disponer de datos de visitas y de los supuestos/factores del modelo SWDM v4.
- Publicar el diferencial solo cuando existan valores reproducibles.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-10-26 | Informe inicial adaptado al stack real del proyecto |
| V_1_1_0 | 2026-11-10 | Se registra la línea base móvil Lighthouse, los umbrales automatizados, reportes como artefactos y la mejora de carga diferida con su FCP todavía pendiente. |

[Volver al README Principal](../../../README.md)
