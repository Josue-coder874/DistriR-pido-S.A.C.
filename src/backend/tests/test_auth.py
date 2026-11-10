from datetime import datetime, timedelta, timezone

import jwt
import pytest

from app.database import SessionLocal
from app.models import AuditLog, User, utcnow
from app.services import auth_service, email_service
from tests.conftest import TEST_PASSWORD, TEST_SECRET_KEY, USER_EMAILS, token_for

ADMIN_EMAIL = USER_EMAILS["ADMINISTRADOR"]
INVALID = "Correo o contraseña incorrectos."


def login(client, email=ADMIN_EMAIL, password=TEST_PASSWORD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def audit_rows(action=None):
    db = SessionLocal()
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)
    rows = [(row.action, row.email, row.result) for row in query.order_by(AuditLog.id)]
    db.close()
    return rows


def set_user(email, **fields):
    db = SessionLocal()
    user = db.query(User).filter(User.email == email).one()
    for name, value in fields.items():
        setattr(user, name, value)
    db.commit()
    db.close()


@pytest.fixture
def clock(monkeypatch):
    """Reloj controlable para simular el paso del tiempo en el bloqueo y la recuperación."""
    state = {"now": utcnow()}
    monkeypatch.setattr(auth_service, "now", lambda: state["now"])

    def advance(**delta):
        state["now"] += timedelta(**delta)

    return advance


@pytest.fixture
def sent_emails(monkeypatch):
    emails = []
    monkeypatch.setattr(email_service, "send_email", lambda to, subject, body: emails.append((to, subject, body)))
    return emails


def reset_token_from(email_body: str) -> str:
    return email_body.split("reset_token=")[1].split()[0]


# --- RF-001 Ruta Gold: inicio de sesión


@pytest.mark.parametrize("role", list(USER_EMAILS))
def test_login_returns_token_and_role(anon_client, role):
    response = login(anon_client, USER_EMAILS[role])

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 480 * 60
    assert data["user"]["email"] == USER_EMAILS[role]
    assert data["user"]["role"] == role
    assert "password_hash" not in data["user"]

    me = anon_client.get("/api/auth/me", headers={"Authorization": f"Bearer {data['access_token']}"})
    assert me.status_code == 200
    assert me.json()["role"] == role


def test_login_email_is_case_insensitive(anon_client):
    assert login(anon_client, "  ADMINISTRADOR@DistriRapido.pe ").status_code == 200


def test_successful_login_is_audited(anon_client):
    login(anon_client)

    assert audit_rows("LOGIN") == [("LOGIN", ADMIN_EMAIL, "EXITOSO")]


def test_wrong_password_and_unknown_email_get_same_error(anon_client):
    wrong_password = login(anon_client, password="Incorrecta1")
    unknown_email = login(anon_client, "nadie@distrirapido.pe")

    assert wrong_password.status_code == unknown_email.status_code == 401
    assert wrong_password.json()["detail"] == unknown_email.json()["detail"] == INVALID
    assert audit_rows("LOGIN") == [
        ("LOGIN", ADMIN_EMAIL, "FALLIDO"),
        ("LOGIN", "nadie@distrirapido.pe", "FALLIDO"),
    ]


@pytest.mark.parametrize(
    "email, password",
    [
        ("' OR 1=1 --", TEST_PASSWORD),
        (ADMIN_EMAIL, "' OR '1'='1"),
        ("admin@distrirapido.pe' --", "x"),
    ],
)
def test_sql_injection_attempts_are_rejected(anon_client, email, password):
    # RNF-004: la consulta es parametrizada; el intento no autentica.
    response = login(anon_client, email, password)

    assert response.status_code in (401, 422)
    assert "access_token" not in response.json()


def test_password_is_stored_hashed(anon_client):
    db = SessionLocal()
    user = db.query(User).filter(User.email == ADMIN_EMAIL).one()
    db.close()

    assert TEST_PASSWORD not in user.password_hash
    assert user.password_hash.startswith("$argon2")


# --- RF-001 Ruta Infeliz / RN-001: bloqueo tras 3 intentos fallidos


def test_third_failed_attempt_locks_account_for_15_minutes(anon_client, clock):
    assert login(anon_client, password="Incorrecta1").status_code == 401
    assert login(anon_client, password="Incorrecta2").status_code == 401

    third = login(anon_client, password="Incorrecta3")

    assert third.status_code == 423
    assert third.json()["detail"] == "Cuenta bloqueada por 3 intentos fallidos. Intenta nuevamente en 15 minutos."
    assert third.headers["Retry-After"] == "900"
    assert audit_rows("ACCOUNT_LOCKED") == [("ACCOUNT_LOCKED", ADMIN_EMAIL, "BLOQUEADO")]


def test_locked_account_rejects_correct_password_and_shows_remaining_time(anon_client, clock):
    for _ in range(3):
        login(anon_client, password="Incorrecta1")

    clock(minutes=10)
    response = login(anon_client)
    assert response.status_code == 423
    assert response.json()["detail"].endswith("Intenta nuevamente en 5 minutos.")

    clock(minutes=4, seconds=30)
    response = login(anon_client)
    assert response.json()["detail"].endswith("Intenta nuevamente en 1 minuto.")
    assert response.headers["Retry-After"] == "30"


def test_account_unlocks_after_15_minutes(anon_client, clock):
    for _ in range(3):
        login(anon_client, password="Incorrecta1")

    clock(minutes=15, seconds=1)

    assert login(anon_client).status_code == 200


def test_counter_restarts_after_lock_expires(anon_client, clock):
    for _ in range(3):
        login(anon_client, password="Incorrecta1")
    clock(minutes=16)

    assert login(anon_client, password="Incorrecta1").status_code == 401
    assert login(anon_client, password="Incorrecta1").status_code == 401


def test_successful_login_resets_failed_attempts(anon_client):
    login(anon_client, password="Incorrecta1")
    login(anon_client, password="Incorrecta1")
    assert login(anon_client).status_code == 200

    assert login(anon_client, password="Incorrecta1").status_code == 401
    assert login(anon_client, password="Incorrecta1").status_code == 401


def test_lock_only_affects_that_account(anon_client):
    for _ in range(3):
        login(anon_client, password="Incorrecta1")

    assert login(anon_client, USER_EMAILS["DESPACHADOR"]).status_code == 200


# --- Sesión


def test_inactive_user_cannot_log_in(anon_client):
    set_user(ADMIN_EMAIL, status="INACTIVO")

    response = login(anon_client)

    assert response.status_code == 403
    assert response.json()["detail"] == "Tu cuenta está inactiva. Contacta al administrador."


def test_inactive_user_with_wrong_password_gets_generic_error(anon_client):
    set_user(ADMIN_EMAIL, status="INACTIVO")

    assert login(anon_client, password="Incorrecta1").json()["detail"] == INVALID


def test_deactivated_user_loses_access_immediately(anon_client):
    token = token_for("ADMINISTRADOR")
    set_user(ADMIN_EMAIL, status="INACTIVO")

    assert anon_client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def bearer(token):
    return {"Authorization": f"Bearer {token}"}


def test_me_requires_token(anon_client):
    response = anon_client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.headers["WWW-Authenticate"] == "Bearer"


@pytest.mark.parametrize(
    "token",
    [
        "no-es-un-jwt",
        jwt.encode(
            {"sub": "1", "iat": 0, "exp": 9999999999},
            "otra-clave-de-prueba-con-32-bytes-minimo",
            algorithm="HS256",
        ),
        jwt.encode({"sub": "1", "iat": 0, "exp": 1}, TEST_SECRET_KEY, algorithm="HS256"),
        jwt.encode({"sub": "abc", "iat": 0, "exp": 9999999999}, TEST_SECRET_KEY, algorithm="HS256"),
        jwt.encode({"sub": "1", "exp": 9999999999}, TEST_SECRET_KEY, algorithm="HS256"),
    ],
    ids=["basura", "otra-firma", "expirado", "sub-invalido", "sin-iat"],
)
def test_invalid_tokens_are_rejected(anon_client, token):
    assert anon_client.get("/api/auth/me", headers=bearer(token)).status_code == 401


def test_unsigned_token_is_rejected(anon_client):
    db = SessionLocal()
    user_id = db.query(User).filter(User.email == ADMIN_EMAIL).one().id
    db.close()
    now = int(datetime.now(timezone.utc).timestamp())
    unsigned = jwt.encode({"sub": str(user_id), "iat": now, "exp": now + 600}, None, algorithm="none")

    assert anon_client.get("/api/auth/me", headers=bearer(unsigned)).status_code == 401


# --- RF-001 Ruta Feliz: recuperación de contraseña


def request_reset(client, email=ADMIN_EMAIL):
    return client.post("/api/auth/password-reset/request", json={"email": email})


def confirm_reset(client, token, new_password="NuevaClave2026"):
    return client.post("/api/auth/password-reset/confirm", json={"token": token, "new_password": new_password})


def test_reset_request_sends_link_valid_for_30_minutes(anon_client, sent_emails):
    response = request_reset(anon_client)

    assert response.status_code == 202
    assert response.json()["message"] == (
        "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
    )
    [(to, subject, body)] = sent_emails
    assert to == ADMIN_EMAIL
    assert "Restablece tu contraseña" in subject
    assert "http://localhost:5173/?reset_token=" in body
    assert "30 minutos" in body


def test_reset_request_for_unknown_email_looks_the_same(anon_client, sent_emails):
    known = request_reset(anon_client)
    unknown = request_reset(anon_client, "nadie@distrirapido.pe")

    assert unknown.status_code == known.status_code == 202
    assert unknown.json() == known.json()
    assert len(sent_emails) == 1


def test_reset_changes_password(anon_client, sent_emails):
    request_reset(anon_client)
    token = reset_token_from(sent_emails[0][2])

    response = confirm_reset(anon_client, token)

    assert response.status_code == 200
    assert login(anon_client, password="NuevaClave2026").status_code == 200
    assert login(anon_client, password=TEST_PASSWORD).status_code == 401
    assert audit_rows("PASSWORD_RESET") == [("PASSWORD_RESET", ADMIN_EMAIL, "EXITOSO")]


def test_reset_token_is_single_use(anon_client, sent_emails):
    request_reset(anon_client)
    token = reset_token_from(sent_emails[0][2])
    confirm_reset(anon_client, token)

    response = confirm_reset(anon_client, token, "OtraClave2026")

    assert response.status_code == 400
    assert response.json()["detail"] == auth_service.INVALID_RESET_TOKEN


def test_reset_token_expires_after_30_minutes(anon_client, sent_emails, clock):
    request_reset(anon_client)
    token = reset_token_from(sent_emails[0][2])

    clock(minutes=30, seconds=1)

    assert confirm_reset(anon_client, token).status_code == 400


def test_reset_token_works_just_before_expiring(anon_client, sent_emails, clock):
    request_reset(anon_client)
    token = reset_token_from(sent_emails[0][2])

    clock(minutes=29, seconds=59)

    assert confirm_reset(anon_client, token).status_code == 200


def test_new_reset_request_invalidates_previous_link(anon_client, sent_emails):
    request_reset(anon_client)
    request_reset(anon_client)
    first, second = (reset_token_from(body) for _, _, body in sent_emails)

    assert confirm_reset(anon_client, first).status_code == 400
    assert confirm_reset(anon_client, second).status_code == 200


def test_reset_with_unknown_token_fails(anon_client):
    assert confirm_reset(anon_client, "token-inventado").status_code == 400


@pytest.mark.parametrize("weak", ["corta1", "solo-letras", "12345678"])
def test_reset_enforces_password_policy(anon_client, sent_emails, weak):
    request_reset(anon_client)
    token = reset_token_from(sent_emails[0][2])

    response = confirm_reset(anon_client, token, weak)

    assert response.status_code == 422
    assert login(anon_client).status_code == 200


def test_reset_invalidates_existing_sessions(anon_client, sent_emails):
    # Sesión abierta hace un minuto, después del último cambio de contraseña.
    set_user(ADMIN_EMAIL, password_changed_at=utcnow() - timedelta(minutes=5))
    db = SessionLocal()
    user_id = db.query(User).filter(User.email == ADMIN_EMAIL).one().id
    db.close()
    issued = int(datetime.now(timezone.utc).timestamp()) - 60
    old_token = jwt.encode(
        {"sub": str(user_id), "iat": issued, "exp": issued + 3600}, TEST_SECRET_KEY, algorithm="HS256"
    )
    assert anon_client.get("/api/auth/me", headers=bearer(old_token)).status_code == 200

    request_reset(anon_client)
    confirm_reset(anon_client, reset_token_from(sent_emails[0][2]))

    assert anon_client.get("/api/auth/me", headers=bearer(old_token)).status_code == 401


def test_reset_unlocks_locked_account(anon_client, sent_emails):
    for _ in range(3):
        login(anon_client, password="Incorrecta1")
    assert login(anon_client).status_code == 423

    request_reset(anon_client)
    confirm_reset(anon_client, reset_token_from(sent_emails[0][2]))

    assert login(anon_client, password="NuevaClave2026").status_code == 200


def test_inactive_user_does_not_receive_reset_email(anon_client, sent_emails):
    set_user(ADMIN_EMAIL, status="INACTIVO")

    assert request_reset(anon_client).status_code == 202
    assert sent_emails == []
