import os
from collections.abc import Generator
from pathlib import Path

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

BACKEND_DIR = Path(__file__).resolve().parents[1]
ALEMBIC_CONFIG_PATH = BACKEND_DIR / "alembic.ini"


def normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


def get_database_url() -> str:
    return normalize_database_url(os.getenv("DATABASE_URL", "sqlite:///./app.db"))


DATABASE_URL = get_database_url()
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app.models import AuditLog, Customer, PasswordResetToken, User, Vehicle  # noqa: F401

    if engine.dialect.name == "sqlite":
        Base.metadata.create_all(bind=engine)
        with engine.begin() as connection:
            columns = {column["name"] for column in inspect(connection).get_columns("customers")}
            for column in ("window_start", "window_end", "demand_kg"):
                if column not in columns:
                    column_type = "FLOAT" if column == "demand_kg" else "TIME"
                    connection.exec_driver_sql(f"ALTER TABLE customers ADD COLUMN {column} {column_type}")
        return

    if engine.dialect.name != "postgresql":
        raise RuntimeError(f"Motor de base de datos no admitido: {engine.dialect.name}.")

    config = Config(str(ALEMBIC_CONFIG_PATH))
    config.set_main_option("script_location", str(BACKEND_DIR / "migrations"))
    script = ScriptDirectory.from_config(config)
    with engine.connect() as connection:
        current_revision = MigrationContext.configure(connection).get_current_revision()
    expected_revision = script.get_current_head()
    if current_revision != expected_revision:
        raise RuntimeError(
            "El esquema PostgreSQL no está actualizado. Ejecuta `alembic upgrade head` "
            "desde src/backend antes de iniciar la API."
        )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
