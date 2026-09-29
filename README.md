# EcoLogística Lima

Plataforma web de optimización de rutas de distribución para **DistriRápido S.A.C.** que calcula rutas considerando costo, tiempo y emisiones de CO₂, en reemplazo de la planificación manual actual.

**Líder del Proyecto:** Josue Gonzales Silupu  
**Asignatura:** Taller de Proyectos 2 · Ingeniería de Sistemas e Informática  
**Estado actual:** Sprint 1 finalizado (2026-09-14 al 2026-09-25) · Sprint 2 en curso

## Equipo

| Integrante | Rol |
|---|---|
| Josue Gonzales Silupu | Líder del proyecto y Scrum Master |
| Nayely Cuicapuza Remigio | Desarrollo backend |
| Esau Landeon Arrellano | Desarrollo frontend |
| Yvonne Ccama Chino | Base de datos y calidad (QA) |

## Tecnologías

- **Backend:** Python, FastAPI, OR-Tools
- **Frontend:** React
- **Base de datos:** PostgreSQL con PostGIS
- **Herramientas:** Docker Compose, GitHub Actions, Jira

## Estructura del repositorio

```text
.
├── README.md
├── .gitignore
├── docs/
│   ├── 01 Inicio/
│   ├── 02 Planificación/
│   └── 03 Implementación/
└── src/
    ├── backend/
    └── frontend/
```

## Documentación

### Inicio y planificación

- [Carpeta 01 Inicio](docs/01%20Inicio/)
- [Carpeta 02 Planificación](docs/02%20Planificaci%C3%B3n/)

### Implementación (Sprint 1)

- [01. Informe de estado del proyecto](docs/03%20Implementaci%C3%B3n/01%20Informe%20de%20estado%20del%20proyecto%20V_1_0_0.md)
- [02. Registro de Impedimentos](docs/03%20Implementaci%C3%B3n/02%20Registro%20de%20Impedimentos%20V_1_0_0.md)
- [03. Revisión del Sprint](docs/03%20Implementaci%C3%B3n/03%20Revisi%C3%B3n%20del%20Sprint%20V_1_0_0.md)
- [04. Retrospectiva del Sprint](docs/03%20Implementaci%C3%B3n/04%20Retrospectiva%20del%20Sprint%20V_1_0_0.md)

## Ejecución local

```bash
# Base de datos con PostGIS
docker compose up -d

# Backend
cd src/backend
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd src/frontend
npm install
npm run dev
```

Copia el archivo `.env.example` como `.env` y completa tus valores. El archivo `.env` no se sube al repositorio.

## Control de versiones de la documentación

La documentación sigue [Versionado Semántico](https://semver.org/lang/es/): cada documento incluye su historial de versiones en el encabezado.

| Fecha | Documento | Versión | Cambio |
|---|---|---|---|
| 2026-09-29 | Documentos de Implementación (01 a 04) | 1.0.0 | Versión inicial del Sprint 1 |
| 2026-09-28 | Stack Tecnológico, Modelo C4, Requisitos Funcionales, Registro de Riesgos y Presupuesto | 1.1.0 | Actualización según decisiones del Sprint 1 |
