[← Volver al README Principal](../../../README.md)

# Reporte de Seguridad OWASP Top 10 (2025)

**Nombre del Proyecto:** EcoLogística Lima – DistriRápido S.A.C.
**Herramienta de Escaneo:** SonarQube / CodeQL / pruebas automatizadas
**Versión:** V_1_0_0

## 1. Matriz de Cumplimiento OWASP Top 10 2025

| Categoría OWASP 2025 | Estado | Hallazgos de SonarQube / controles locales |
|---|---|---|
| A01:2025-Broken Access Control | Bajo revisión | RBAC aplicado en API y frontend. Completar pruebas de todos los permisos por rol. |
| A02:2025-Cryptographic Failures | Bajo revisión | Argon2 para contraseñas; TLS y cifrado AES no desplegados. |
| A03:2025-Injection | Bajo revisión | SQLAlchemy ORM y pruebas de seguridad; ejecutar análisis SonarCloud. |
| A04:2025-Insecure Design | Bajo revisión | Diseño con permisos y bloqueo de cuenta; ampliar pruebas de recuperación. |
| A05:2025-Security Misconfiguration | Bajo revisión | Secretos mediante `.env`; revisar cabeceras, CORS y despliegue. |
| A06:2025-Vulnerable and Outdated Components | Bajo revisión | Dependencias fijadas; ejecutar auditorías npm/pip y SonarCloud. |
| A07:2025-Identification and Authentication Failures | Bajo revisión | JWT, bloqueo tras intentos y recuperación de contraseña implementados. |
| A08:2025-Software and Data Integrity Failures | Limpio | Git, revisión mediante PR y CI propuestos como controles. |
| A09:2025-Security Logging and Monitoring Failures | Bajo revisión | AuditLog implementado; falta integración centralizada de alertas. |
| A10:2025-Server-Side Request Forgery (SSRF) | Limpio por alcance | No se observa backend que consuma URL arbitrarias controladas por usuarios. |

## 2. Detalles de Security Hotspots

- **Hotspot de configuración JWT:** la clave debe tener al menos 32 bytes y permanecer fuera del repositorio.
- **Hotspot CORS:** el desarrollo permite cualquier origen; limitar al dominio final antes de producción.
- **Hotspot de secretos:** el archivo `.env` está excluido y existe `.env.example` sin credenciales reales.

[Volver al README Principal](../../../README.md)
