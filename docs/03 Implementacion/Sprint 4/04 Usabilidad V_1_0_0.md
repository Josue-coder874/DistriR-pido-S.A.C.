[← Volver al README principal](../../../README.md)

# Usabilidad

**Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Versión:** V_1_0_0
**Fecha de elaboración:** 2026-11-17

## Instrumento

Se utiliza el System Usability Scale (SUS), compuesto por 10 afirmaciones y escala Likert de 1 a 5. Se debe aplicar sobre una muestra de al menos cinco usuarios finales representativos o stakeholders que hayan usado la misma versión desplegada.

Los participantes seleccionados deben completar las mismas tareas sin ayuda durante la ejecución:

1. Iniciar sesión.
2. Consultar el dashboard.
3. Registrar o consultar un pedido.
4. Consultar la flota.
5. Ejecutar una optimización y revisar pedidos no asignados.

Ficha técnica que debe completarse al recoger las respuestas:

| Campo | Registro |
|---|---|
| Fecha | Registrar en el día de la sesión |
| Entorno | URL HTTPS exacta del frontend desplegado |
| Versión | Commit desplegado |
| Participantes | n >= 5, sin publicar datos personales |
| Criterios | Usuarios finales o stakeholders representativos de administrador, despachador y auditor |
| Consentimiento | Confirmación de participación y uso exclusivo académico |
| Ayuda | Ninguna durante la ejecución de tareas |
| Exclusiones | Documentar motivo; no imputar respuestas ausentes |

## Cuestionario SUS estándar

1. Creo que me gustaría utilizar este sistema con frecuencia.
2. El sistema me resultó innecesariamente complejo.
3. El sistema fue fácil de utilizar.
4. Creo que necesitaría ayuda técnica para utilizar el sistema.
5. Las diversas funciones del sistema estaban bien integradas.
6. El sistema presentó demasiadas inconsistencias.
7. Creo que la mayoría de las personas aprenderían a usar el sistema rápidamente.
8. Encontré el sistema muy complicado de usar.
9. Me sentí seguro usando el sistema.
10. Tuve que aprender muchas cosas antes de poder utilizar el sistema.

Escala: 1 = totalmente en desacuerdo; 5 = totalmente de acuerdo.

## Cálculo

Para cada participante:

1. Restar 1 a los ítems impares 1, 3, 5, 7 y 9.
2. Restar de 5 las respuestas de los ítems pares 2, 4, 6, 8 y 10.
3. Sumar los diez valores ajustados.
4. Multiplicar la suma por 2.5.

El puntaje individual queda entre 0 y 100. El promedio global es la suma de los puntajes individuales dividida entre `n`.

## Resultados cuantitativos

No se realizaron aún respuestas SUS reales de al menos cinco participantes sobre la versión desplegada. Por ello no se presenta una matriz de respuestas simulada ni se reporta un promedio ficticio.

Al finalizar la evaluación se deberá registrar una fila anónima por participante con sus 10 respuestas brutas y su puntaje individual. La matriz debe mostrar los cálculos sin redondear los puntajes intermedios y redondear únicamente el resultado final a un decimal.

| Participante | I1 | I2 | I3 | I4 | I5 | I6 | I7 | I8 | I9 | I10 | Puntaje ajustado |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Pendiente de medición real | — | — | — | — | — | — | — | — | — | — | — |

El contenido anterior no constituye una respuesta parcial ni una imputación; identifica explícitamente que falta la recolección real.

## Interpretación y umbrales

Sauro y Lewis clasifican el puntaje sin redondear según la siguiente escala:

- A: mayor o igual a 80.3.
- B: mayor o igual a 74 y menor a 80.3.
- C: mayor o igual a 68 y menor a 74.
- D: mayor o igual a 51 y menor a 68.
- F: menor a 51.

Un promedio mayor o igual a 68 se considera aceptable. La calificación SUS representa percepción de usabilidad, no porcentaje de éxito de tareas. Una vez recogidas las respuestas se deben identificar problemas observados y registrar mejoras verificables con responsable y fecha.

## Problemas y mejoras verificables

Las mejoras finales deberán basarse únicamente en observaciones reales de la prueba. La primera revisión técnica prioriza comprobar:

- Mensajes de validación de autenticación y formularios.
- Claridad de estados de carga y errores de API.
- Accesibilidad de navegación por teclado.
- Comprensión de pedidos no asignados y capacidad de flota.
- Legibilidad de métricas y tabla de rutas.

Cada mejora aceptada debe incluir evidencia posterior, como prueba automatizada, captura o medición SUS repetida.

## Referencia

Sauro, J. y Lewis, J. R. (2016). *Quantifying the User Experience: Practical Statistics for User Research*, 2nd edition. Morgan Kaufmann.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-17 | Se define el instrumento SUS, la ficha técnica, el método de cálculo y el criterio de interpretación sin inventar datos de participantes. |
