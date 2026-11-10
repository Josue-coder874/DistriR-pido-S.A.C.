[← Volver al README Principal](../../../README.md)

# Reporte de Seguridad OWASP Top 10 (2025)

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Herramientas y evidencia:** pruebas automatizadas, `npm audit`, `pip-audit`; workflows de CodeQL y SonarCloud configurados, ejecuciones externas no verificadas en este reporte.
**Versión:** V_1_1_0
**Fecha de revisión local:** 2026-11-10

## 1. Matriz de Cumplimiento OWASP Top 10 2025

| Categoría OWASP 2025 | Estado | Hallazgos y evidencia |
|---|---|---|
| A01:2025-Broken Access Control | Limpio (alcance API probado) | La matriz de permisos cubre las operaciones de clientes, flota y optimización de rutas para los cuatro roles; se prueban también solicitudes anónimas y accesos denegados. Evidencia: `tests/test_rbac.py`. |
| A02:2025-Cryptographic Failures | Bajo revisión | Argon2 y JWT HS256 están implementados; staging/producción exigen una clave JWT de al menos 32 bytes. TLS y cifrado de datos en reposo aún no están desplegados ni verificados. |
| A03:2025-Injection | Bajo revisión | Consultas de aplicación mediante SQLAlchemy y pruebas de intentos de inyección en autenticación (`tests/test_auth.py`). Falta verificar resultados de un análisis estático/SonarCloud. |
| A04:2025-Insecure Design | Limpio (controles locales probados) | Se probaron bloqueo y desbloqueo, errores de autenticación no diferenciables, expiración y uso único de enlaces de recuperación, política de contraseñas e invalidación de sesiones (`tests/test_auth.py`). |
| A05:2025-Security Misconfiguration | Bajo revisión | CORS ya no acepta cualquier origen; en staging/producción se requieren orígenes HTTPS, secreto fuerte y SMTP. Se prueban cabeceras y CORS localmente. Falta validar el proxy TLS, HSTS y configuración efectiva en staging/producción. |
| A06:2025-Vulnerable and Outdated Components | Limpio (dependencias auditadas) | `npm audit --audit-level=low` y `py -3.12 -m pip_audit -r src/backend/requirements-dev.txt` no reportaron vulnerabilidades conocidas tras actualizar dependencias. Repetir ambas auditorías al cambiar dependencias. |
| A07:2025-Identification and Authentication Failures | Bajo revisión | Hay pruebas de JWT inválidos, bloqueo, restablecimiento y sesiones; el frontend mantiene el token en `sessionStorage`. Se requiere revisar el modelo de sesión/XSS antes de dar por cerrado el control. |
| A08:2025-Software and Data Integrity Failures | Bajo revisión | CI, CodeQL y SonarCloud tienen workflows en el repositorio y permisos de CI limitados. No se verificaron ejecuciones remotas satisfactorias, protección de ramas ni revisiones obligatorias de PR. |
| A09:2025-Security Logging and Monitoring Failures | Bajo revisión | Los accesos y denegaciones se registran en `AuditLog`; no hay integración centralizada de alertas ni evidencia de monitoreo operativo. |
| A10:2025-Server-Side Request Forgery (SSRF) | Limpio por alcance local | No se encontró consumo de URLs proporcionadas por usuarios ni clientes HTTP en `src/backend/app`. Reevaluar si se incorpora integración que realice solicitudes salientes. |

**Interpretación:** “Limpio” se limita al control y evidencia local descritos en cada fila; no equivale a certificación integral ni a validación de una instalación en producción. Los estados “Bajo revisión” requieren la evidencia externa o de despliegue indicada.

## 2. Validación local

- Backend: 144 pruebas aprobadas; cobertura de líneas 97.70% (el umbral de CI es 80%).
- Frontend: 85 pruebas aprobadas; cobertura de líneas 99.55%; compilación de producción correcta.
- Dependencias de frontend y backend (incluidas las de desarrollo): ambas auditorías sin vulnerabilidades conocidas.
- Configuración segura: pruebas para rechazo de clave ausente/débil, origen CORS comodín o HTTP en entornos seguros, y SMTP ausente; pruebas de cabeceras HTTP, caché de autenticación y preflight CORS.

Los resultados son validaciones locales. No sustituyen la ejecución de GitHub Actions, análisis publicados por CodeQL/SonarCloud, pruebas de penetración, despliegue TLS, ni comprobación de controles de la organización de GitHub.

## 3. Hotspots y acciones pendientes

- **Secretos:** `SECRET_KEY` se debe generar fuera del repositorio, mantener fuera de `.env.example` y rotar ante una exposición. En staging/producción se valida una longitud mínima de 32 bytes.
- **CORS y cabeceras:** se usan orígenes explícitos y métodos/cabeceras permitidos; `allow_credentials` está deshabilitado. HSTS solo se envía en solicitudes que la aplicación reconoce como HTTPS; verificar el proxy TLS antes del despliegue.
- **Dependencias:** repetir `npm audit` y `pip-audit` en cada actualización, además de atender los resultados del CI.
- **Cierre externo:** desplegar staging con TLS, revisar cifrado de datos en reposo, verificar CodeQL/SonarCloud y protección de ramas, y conectar alertas centralizadas antes de cambiar los estados pendientes.

## Historial de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0.0 | 2026-11-08 | Matriz inicial de controles OWASP. |
| 1.1.0 | 2026-11-10 | Se incorporan hardening local, auditorías de dependencias y evidencia de pruebas; se conservan como pendientes los controles que requieren staging o verificación externa. |

[Volver al README Principal](../../../README.md)
