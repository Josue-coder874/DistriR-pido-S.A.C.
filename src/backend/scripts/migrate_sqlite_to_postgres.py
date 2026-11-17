import argparse
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, func, insert, inspect, select, text
from sqlalchemy.engine import URL

from app.database import Base, get_database_url
from app import models  # noqa: F401


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Import app tables from SQLite into an already-migrated, empty PostgreSQL database."
    )
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("app.db"),
        help="SQLite source file (default: app.db in the current directory).",
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Import the data. Without this option, only run a read-only preflight.",
    )
    parser.add_argument(
        "--yes",
        action="store_true",
        help="Skip the confirmation prompt; only valid together with --apply.",
    )
    args = parser.parse_args()
    if args.yes and not args.apply:
        parser.error("--yes solo se puede usar junto con --apply.")
    return args


def count_rows(connection, table) -> int:
    return connection.scalar(select(func.count()).select_from(table)) or 0


def source_columns_for_table(table, available_columns: set[str]):
    missing_columns = [column for column in table.columns if column.name not in available_columns]
    required_missing = [column.name for column in missing_columns if not column.nullable]
    if required_missing:
        raise RuntimeError(
            f"La tabla SQLite {table.name} no tiene columnas obligatorias: "
            f"{', '.join(required_missing)}."
        )
    return [column for column in table.columns if column.name in available_columns]


def main() -> int:
    args = parse_args()
    backend_dir = Path(__file__).resolve().parents[1]
    load_dotenv(backend_dir / ".env", override=False)

    source_path = args.source.resolve()
    if not source_path.is_file():
        raise FileNotFoundError(f"No existe la base SQLite de origen: {source_path}")

    target_url = get_database_url()
    target_engine = create_engine(target_url, pool_pre_ping=True)
    if target_engine.dialect.name != "postgresql":
        target_engine.dispose()
        raise RuntimeError("DATABASE_URL debe apuntar a PostgreSQL; no se modificó ninguna base.")

    source_engine = create_engine(URL.create("sqlite", database=str(source_path)))
    tables = list(Base.metadata.sorted_tables)
    try:
        source_table_names = set(inspect(source_engine).get_table_names())
        missing_source = [table.name for table in tables if table.name not in source_table_names]
        if missing_source:
            raise RuntimeError(f"Faltan tablas en SQLite: {', '.join(missing_source)}")
        source_inspector = inspect(source_engine)
        source_columns = {
            table.name: source_columns_for_table(
                table,
                {column["name"] for column in source_inspector.get_columns(table.name)},
            )
            for table in tables
        }

        target_inspector = inspect(target_engine)
        target_table_names = set(target_inspector.get_table_names())
        missing_target = [table.name for table in tables if table.name not in target_table_names]
        if missing_target or "alembic_version" not in target_table_names:
            raise RuntimeError("Ejecuta `alembic upgrade head` en PostgreSQL antes de importar los datos.")

        with source_engine.connect() as source, target_engine.connect() as target:
            source_counts = {table.name: count_rows(source, table) for table in tables}
            target_counts = {table.name: count_rows(target, table) for table in tables}
        occupied_tables = [name for name, count in target_counts.items() if count]
        if occupied_tables:
            raise RuntimeError(
                "La base PostgreSQL de destino no está vacía; no se importó nada. "
                f"Tablas con datos: {', '.join(occupied_tables)}"
            )

        print("Preflight correcto. Registros a importar (sin mostrar datos personales):")
        for table in tables:
            print(f"  {table.name}: {source_counts[table.name]}")
            omitted_nullable_columns = [
                column.name for column in table.columns if column not in source_columns[table.name]
            ]
            if omitted_nullable_columns:
                print(
                    f"    columnas opcionales ausentes (se usarán NULL): "
                    f"{', '.join(omitted_nullable_columns)}"
                )

        if not args.apply:
            print("Simulación solamente. Revisa el origen y ejecuta con --apply para importar.")
            return 0

        if not args.yes and input("Escribe IMPORT para confirmar la importación: ").strip() != "IMPORT":
            print("Importación cancelada; no se modificó PostgreSQL.")
            return 1

        with source_engine.connect() as source, target_engine.begin() as target:
            for table in tables:
                result = source.execute(select(*source_columns[table.name]))
                while rows := result.fetchmany(500):
                    target.execute(insert(table), [dict(row._mapping) for row in rows])

            for table in tables:
                primary_key = list(table.primary_key.columns)
                if (
                    len(primary_key) == 1
                    and primary_key[0].name == "id"
                    and source_counts[table.name] > 0
                ):
                    quoted_table = target_engine.dialect.identifier_preparer.quote(table.name)
                    quoted_id = target_engine.dialect.identifier_preparer.quote("id")
                    max_id = target.scalar(text(f"SELECT MAX({quoted_id}) FROM {quoted_table}"))
                    target.execute(
                        text(
                            "SELECT setval(pg_get_serial_sequence(:table_name, :column_name), "
                            ":max_id, true)"
                        ),
                        {"table_name": table.name, "column_name": "id", "max_id": max_id},
                    )

            actual_counts = {table.name: count_rows(target, table) for table in tables}
            if actual_counts != source_counts:
                raise RuntimeError("La verificación de cantidades no coincide; se revierte la transacción.")

        print("Importación completada y cantidades verificadas.")
        return 0
    finally:
        source_engine.dispose()
        target_engine.dispose()


if __name__ == "__main__":
    raise SystemExit(main())
