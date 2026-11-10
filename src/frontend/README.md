# Frontend

Este módulo concentra la interfaz web para la gestión y visualización de rutas y métricas operativas de EcoLogística Lima.

## Objetivo
- Presentar la planificación de rutas al usuario final.
- Permitir la consulta de indicadores y resultados del cálculo.
- Ofrecer una experiencia de operación clara y usable.

## Tecnologías
- React
- Vite
- CSS moderno
- Consumo de APIs REST

La planificación presenta la secuencia de paradas sobre mosaicos de OpenStreetMap con controles de acercamiento y alejamiento. La línea entre puntos es esquemática, no sigue calles ni refleja tráfico en tiempo real. Requiere conexión a internet para cargar el mapa y muestra la atribución requerida a OpenStreetMap.

Los listados de clientes/pedidos y vehículos muestran 12 registros por página y consultan los endpoints paginados. El conteo corresponde al total de registros, no únicamente a la página visible. Cada pedido nuevo solicita su demanda en kg; los registros históricos sin peso pueden completarse desde el módulo Pedidos. La optimización automática usa la flota activa completa, asigna cada ruta a un vehículo y muestra la carga/capacidad por vehículo y los pedidos no asignados con su motivo. Elegir un vehículo limita el cálculo a ese vehículo. La API toma todos los pedidos aunque la interfaz muestre solo una página.

## Auditoría Lighthouse

Desde esta carpeta, ejecuta `npm run build` y luego `npx --yes @lhci/cli@0.15.1 autorun --config=./lighthouserc.json`. Lighthouse mide tres veces el build de producción en configuración móvil y valida los umbrales definidos en `lighthouserc.json`. Los informes se generan en `.lighthouseci/` y `lhci-reports/`; no se versionan. En GitHub Actions, el workflow `Green IT & Performance Audit` adjunta los informes a la ejecución por 14 días, con acceso sujeto a la visibilidad y permisos del repositorio.
