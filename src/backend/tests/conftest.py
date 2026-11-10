import os
import tempfile
from pathlib import Path

import pytest

# La base de pruebas se define antes de importar la app para no tocar app.db.
_TEST_DB = Path(tempfile.mkdtemp()) / "test.db"
os.environ["DATABASE_URL"] = f"sqlite:///{_TEST_DB.as_posix()}"
TEST_SECRET_KEY = "test-secret-key-for-jwt-signing-at-least-32-bytes"
os.environ["SECRET_KEY"] = TEST_SECRET_KEY
os.environ["FRONTEND_URL"] = "http://localhost:5173"
os.environ["SMTP_HOST"] = ""

from fastapi.testclient import TestClient  # noqa: E402

from app.database import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models import AuditLog, Customer, PasswordResetToken, User, Vehicle  # noqa: E402
from app.security import ROLES, create_access_token, hash_password  # noqa: E402

TEST_PASSWORD = "Segura2026"
# Se calcula una sola vez: Argon2 es lento a propósito.
_TEST_PASSWORD_HASH = hash_password(TEST_PASSWORD)
USER_EMAILS = {role: f"{role.lower()}@distrirapido.pe" for role in ROLES}


def _reset_database() -> None:
    db = SessionLocal()
    for model in (AuditLog, PasswordResetToken, Customer, Vehicle, User):
        db.query(model).delete()
    db.add_all(
        User(name=f"Usuario {role.title()}", email=email, password_hash=_TEST_PASSWORD_HASH, role=role)
        for role, email in USER_EMAILS.items()
    )
    db.commit()
    db.close()


def token_for(role: str) -> str:
    db = SessionLocal()
    user = db.query(User).filter(User.email == USER_EMAILS[role]).one()
    token = create_access_token(user)
    db.close()
    return token


@pytest.fixture
def anon_client():
    with TestClient(app) as test_client:
        _reset_database()
        yield test_client


@pytest.fixture
def client_as(anon_client):
    def make(role: str) -> TestClient:
        return TestClient(app, headers={"Authorization": f"Bearer {token_for(role)}"})

    return make


@pytest.fixture
def client(client_as):
    # Las pruebas de clientes, flota y rutas se ejecutan como Administrador.
    return client_as("ADMINISTRADOR")
