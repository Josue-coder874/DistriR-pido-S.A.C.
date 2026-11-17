from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect
from sqlalchemy.engine import URL

from app.database import normalize_database_url
from app.models import Customer
from scripts.migrate_sqlite_to_postgres import source_columns_for_table


@pytest.mark.parametrize(
    ("source", "expected"),
    [
        ("postgres://user:pass@host:5432/db", "postgresql+psycopg://user:pass@host:5432/db"),
        ("postgresql://user:pass@host:5432/db", "postgresql+psycopg://user:pass@host:5432/db"),
        ("postgresql+psycopg://user:pass@host:5432/db", "postgresql+psycopg://user:pass@host:5432/db"),
        ("sqlite:///./app.db", "sqlite:///./app.db"),
    ],
)
def test_normalize_database_url(source, expected):
    assert normalize_database_url(source) == expected


def test_source_columns_allow_missing_nullable_legacy_columns():
    available = {"id", "name", "address", "latitude", "longitude", "priority"}

    columns = source_columns_for_table(Customer.__table__, available)

    assert {column.name for column in columns} == available


def test_source_columns_reject_missing_required_legacy_columns():
    with pytest.raises(RuntimeError, match="name"):
        source_columns_for_table(Customer.__table__, {"id", "address"})


def test_initial_alembic_migration_creates_and_drops_schema(tmp_path):
    backend_dir = Path(__file__).resolve().parents[1]
    database_path = tmp_path / "migration-test.db"
    config = Config(str(backend_dir / "alembic.ini"))
    config.set_main_option("script_location", str(backend_dir / "migrations"))
    config.attributes["database_url"] = str(URL.create("sqlite", database=str(database_path)))

    command.upgrade(config, "head")
    command.check(config)

    engine = create_engine(URL.create("sqlite", database=str(database_path)))
    try:
        inspector = inspect(engine)
        assert {
            "customers",
            "vehicles",
            "users",
            "password_reset_tokens",
            "audit_logs",
            "alembic_version",
        } <= set(inspector.get_table_names())
        assert {
            "demand_kg",
            "window_start",
            "window_end",
        } <= {column["name"] for column in inspector.get_columns("customers")}
    finally:
        engine.dispose()

    command.downgrade(config, "base")

    engine = create_engine(URL.create("sqlite", database=str(database_path)))
    try:
        assert inspect(engine).get_table_names() == ["alembic_version"]
    finally:
        engine.dispose()
