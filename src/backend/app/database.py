import os
from collections.abc import Generator

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def init_db() -> None:
    from app.models import AuditLog, Customer, PasswordResetToken, User, Vehicle  # noqa: F401

    Base.metadata.create_all(bind=engine)
    if engine.dialect.name == "sqlite":
        with engine.begin() as connection:
            columns = {column["name"] for column in inspect(connection).get_columns("customers")}
            for column in ("window_start", "window_end", "demand_kg"):
                if column not in columns:
                    column_type = "FLOAT" if column == "demand_kg" else "TIME"
                    connection.exec_driver_sql(f"ALTER TABLE customers ADD COLUMN {column} {column_type}")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
