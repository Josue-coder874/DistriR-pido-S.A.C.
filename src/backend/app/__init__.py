from pathlib import Path

from dotenv import load_dotenv

# Carga src/backend/.env antes de que cualquier módulo lea variables de entorno.
# Las variables ya definidas en el entorno tienen prioridad.
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
