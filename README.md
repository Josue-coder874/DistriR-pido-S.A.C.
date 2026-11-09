# EcoLogística Lima

Plataforma web de optimización de rutas de distribución para **DistriRápido S.A.C.** que calcula rutas considerando costo, tiempo y emisiones de CO₂, en reemplazo de la planificación manual actual.

**Líder del Proyecto:** Josue Gonzales Silipu  
**Asignatura:** Taller de Proyectos 2 · Ingeniería de Sistemas e Informática  
**Estado actual:** Sprint cerrado en Jira · Actividades `LD-9` a `LD-26` en **Listo**, asignadas a Josue Gonzales Silipu, vencimiento 2026-10-09.

## Equipo

| Integrante | Rol |
|---|---|
| Josue Gonzales Silipu | Líder del proyecto y Scrum Master |
| Nayely Cuicapuza Remigio | Desarrollo backend |
| Esau Landeon Arrellano | Desarrollo frontend |

## Tecnologías

- **Backend:** Python, FastAPI, OR-Tools
- **Frontend:** React, Vite
- **Base de datos:** SQLite local para el MVP; persistencia real en el archivo `src/backend/app.db` sin necesidad de servidor externo
- **Control de versiones:** Git

## Estructura del repositorio

```text
.
├── README.md
├── .gitignore
├── docs/
│   ├── 01 Inicio/
│   ├── 02 Planificacion/
│   └── 03 Implementacion/
│       ├── Sprint 1/
│       └── Sprint 2/
└── src/
    ├── backend/
    └── frontend/
```

## Documentación

### Inicio y planificación

- [Carpeta 01 Inicio](docs/01%20Inicio/)
- [Carpeta 02 Planificación](docs/02%20Planificacion/)

### Entregables del Sprint 2

| Documento | Enlace |
|---|---|
| 01. Informe de estado del proyecto | [V_1_0_0](docs/03%20Implementacion/Sprint%202/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md) |
| 02. Registro de impedimentos | [V_1_0_0](docs/03%20Implementacion/Sprint%202/02%20Registro%20de%20Impedimentos%20V_1_0_0.md) |
| 03. Revisión del Sprint | [V_1_0_0](docs/03%20Implementacion/Sprint%202/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md) |
| 04. Retrospectiva del Sprint | [V_1_0_0](docs/03%20Implementacion/Sprint%202/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md) |

Cada documento incluye un enlace de retorno a este README.

### Entregables del Sprint 3

| Documento | Enlace |
|---|---|
| 01. Revisión del Sprint | [V_1_0_0](docs/03%20Implementacion/Sprint%2003/01%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md) |
| 02. Retrospectiva del Sprint | [V_1_0_0](docs/03%20Implementacion/Sprint%2003/02%20Retrospectiva%20del%20Sprint%20V_1_0_0.md) |
| 03. Calidad de código | [V_1_0_0](docs/03%20Implementacion/Sprint%2003/03%20Calidad%20de%20c%C3%B3digo%20V_1_0_0.md) |
| 04. OWASP Top 10 2025 | [V_1_0_0](docs/03%20Implementacion/Sprint%2003/04%20OWASP%20V_1_0_0.md) |
| 05. Accesibilidad WCAG | [V_1_0_0](docs/03%20Implementacion/Sprint%2003/05%20WCAG%20V_1_0_0.md) |

Cada documento incluye un enlace de retorno a este README.

### Informes Green IT

- [Informe de reducción del impacto ambiental](docs/03%20Implementacion/reduccion%20del%20impacto%20ambiental/01%20Informe%20de%20reduccion%20del%20impacto%20ambiental%20V_1_0_0.md)
- [Estándares de ingeniería de software](docs/03%20Implementacion/reduccion%20del%20impacto%20ambiental/02%20Estandares%20Ingenier%C3%ADa%20de%20software%20V_1_0_0.md)

## Ejecución local

```powershell
# Backend
cd src/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
# Configura SECRET_KEY en .env
python -m scripts.create_user --email admin@distrirapido.pe --name "Administrador" --role ADMINISTRADOR
python -m uvicorn app.main:app --reload

# Frontend
cd ../frontend
npm install
npm run dev
```

El archivo `.env` no se sube al repositorio. El backend utiliza SQLite como base de datos definitiva para el alcance del MVP y crea/actualiza el archivo local `src/backend/app.db`. PostgreSQL/PostGIS no forma parte de la implementación acordada para este proyecto.

Toda la API requiere inicio de sesión. Los roles disponibles son `ADMINISTRADOR`, `DESPACHADOR`, `CONDUCTOR` y `AUDITOR`. Sin `SMTP_HOST`, el enlace de recuperación de contraseña se muestra en el log del backend.

Pruebas con cobertura mínima de líneas del 80%: instala primero `src/backend/requirements-dev.txt` y, desde `src/backend`, ejecuta `python -m pytest --cov=app --cov-report=xml:coverage.xml --cov-report=term-missing` seguido de `python -m scripts.check_line_coverage --threshold 80`. En `src/frontend`, ejecuta `npm run test:coverage`. El workflow de CI y el análisis de SonarCloud aplican el mismo umbral de líneas al backend.

El workflow de SonarCloud comprueba que existan los reportes `src/backend/coverage.xml` y `src/frontend/coverage/lcov.info` antes del análisis y espera el resultado del Quality Gate. Para usar este análisis de CI, desactiva **Automatic Analysis** en la configuración del proyecto de SonarCloud; SonarCloud no permite combinar ambos modos. Configura `SONAR_TOKEN` como secreto y `SONAR_ORGANIZATION` como variable de Actions; `SONAR_PROJECT_KEY` es opcional si se usa la clave predeterminada del archivo de propiedades. Para bloquear el merge, configura el check `SonarCloud / sonarcloud` como obligatorio en las reglas de protección de la rama destino.

## Control de versiones de la documentación

La documentación sigue [Versionado Semántico](https://semver.org/lang/es/): cada documento incluye su historial de versiones.

| Fecha | Documento | Versión | Cambio |
| --- | --- | --- | --- |
| 2026-10-06 | Documentos de Implementación del Sprint 2 (01 a 04) | 1.0.0 | Entregables completos del Sprint 2 con trazabilidad y navegación. |
| 2026-10-06 | Documentos de Implementación del Sprint 1 (01 a 04) | 1.1.0 | Trazabilidad con el backlog, corrección del estado real y organización por sprint. |
| 2026-09-29 | Documentos de Implementación (01 a 04) | 1.0.0 | Versión inicial del Sprint 1. |
| 2026-09-28 | Stack Tecnológico, Modelo C4, Requisitos Funcionales, Registro de Riesgos y Presupuesto | 1.1.0 | Actualización según decisiones del Sprint 1. |
