[← Volver al README Principal](../../../README.md)

# Estándares de Ingeniería de Software y Guía de Desarrollo Verde

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_0_0
**Fecha:** 2026-10-26

## 1. ISO/IEC 25010

| Característica | Aplicación vigente |
|---|---|
| Eficiencia de desempeño | Motor OR-Tools, API FastAPI, bundles Vite y consultas SQLAlchemy |
| Mantenibilidad | Separación frontend/backend, componentes React y servicios backend |
| Seguridad | RBAC, Argon2, JWT, audit log y análisis CodeQL |
| Fiabilidad | Pruebas automatizadas backend y frontend |
| Usabilidad | Navegación modular, estados visuales y controles HTML semánticos |

## 2. Green Software Foundation

- Minimizar procesamiento por solicitud evitando cálculos innecesarios.
- Mantener dependencias actualizadas y necesarias.
- Evitar cargas de datos completas mediante filtros y módulos específicos.
- Apagar procesos locales cuando ya no se usen y utilizar contenedores de CI efímeros.
- Medir intensidad de carbono solo con datos reproducibles.

## 3. W3C Web Sustainability Guidelines

Se aplican y verifican como objetivos:

- Código dividido por rutas funcionales.
- Recursos estáticos con caché administrada por el servidor.
- Payloads compactos y respuestas específicas por endpoint.
- Interfaces navegables por teclado y semántica accesible.
- Eliminación de contenido visual innecesario en rutas no activas.

## 4. Buenas prácticas Backend

- Validar filtros, límites y tamaños máximos en cada endpoint de listado.
- Mantener consultas SQLAlchemy parametrizadas y ordenadas por índices disponibles.
- Aplicar compresión HTTP solo si el servidor del despliegue soporta GZip/Brotli de forma segura.
- Registrar auditoría sin datos personales innecesarios.
- Limitar CORS al dominio final antes de producción.

## 5. Buenas prácticas Frontend

- Modificar únicamente dependencias necesarias.
- Mantener carga diferida para módulos grandes cuando sea conveniente.
- Añadir dimensiones a imágenes para evitar cambios de diseño.
- Usar texto alternativo y navegación por teclado.
- Ejecutar Lighthouse antes de aceptar nuevas características visuales.

## 6. Matriz de trazabilidad

| Práctica Green IT | Evidencia en el proyecto |
|---|---|
| Modularidad | Módulos Dashboard, Pedidos, Rutas y Flota |
| Eficiencia de red | API REST y endpoints específicos |
| Procesamiento eficiente | Motor OR-Tools desacoplado |
| Calidad continua | GitHub Actions, CodeQL, pytest y Vitest |
| Sostenibilidad verificable | Informe de medición con análisis reproducible pendiente |

## 7. Integración recomendada en CI

La auditoría Lighthouse debe ejecutarse después de desplegar una versión accesible al runner. El workflow debe usar `continue-on-error: false` para métricas declaradas como umbrales y guardar el reporte como artefacto.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| V_1_0_0 | 2026-10-26 | Guía verde adaptada a FastAPI, React, Vite y SQLite |

[Volver al README Principal](../../../README.md)
