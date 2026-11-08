import math
import secrets
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import PasswordResetToken, User, utcnow
from app.security import (
    hash_password,
    hash_token,
    password_needs_rehash,
    verify_dummy_password,
    verify_password,
)
from app.services.audit_service import record_audit

INVALID_CREDENTIALS = "Correo o contraseña incorrectos."
INVALID_RESET_TOKEN = "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."


class AuthError(Exception):
    def __init__(self, status_code: int, detail: str, headers: dict | None = None):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail
        self.headers = headers


def now() -> datetime:
    # Punto único de lectura del reloj: las pruebas lo reemplazan para simular el paso del tiempo.
    return utcnow()


def _locked_error(remaining: timedelta) -> AuthError:
    seconds = max(1, math.ceil(remaining.total_seconds()))
    minutes = math.ceil(seconds / 60)
    attempts = get_settings().max_failed_logins
    unit = "minuto" if minutes == 1 else "minutos"
    return AuthError(
        423,
        f"Cuenta bloqueada por {attempts} intentos fallidos. Intenta nuevamente en {minutes} {unit}.",
        headers={"Retry-After": str(seconds)},
    )


def find_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email.strip().lower()).first()


def authenticate(db: Session, email: str, password: str) -> User:
    settings = get_settings()
    email = email.strip().lower()
    user = find_user_by_email(db, email)
    current = now()

    if user is None:
        verify_dummy_password(password)
        record_audit(db, "LOGIN", "auth", "FALLIDO", email=email)
        raise AuthError(401, INVALID_CREDENTIALS)

    # RN-001: mientras dure el bloqueo se rechaza cualquier intento, incluso con la contraseña correcta.
    if user.locked_until and user.locked_until > current:
        record_audit(db, "LOGIN", "auth", "BLOQUEADO", user=user)
        raise _locked_error(user.locked_until - current)
    if user.locked_until:
        user.locked_until = None
        user.failed_login_attempts = 0

    if not verify_password(user.password_hash, password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= settings.max_failed_logins:
            user.failed_login_attempts = 0
            user.locked_until = current + timedelta(minutes=settings.lockout_minutes)
            record_audit(db, "ACCOUNT_LOCKED", "auth", "BLOQUEADO", user=user)
            raise _locked_error(timedelta(minutes=settings.lockout_minutes))
        record_audit(db, "LOGIN", "auth", "FALLIDO", user=user)
        raise AuthError(401, INVALID_CREDENTIALS)

    user.failed_login_attempts = 0
    if user.status != "ACTIVO":
        record_audit(db, "LOGIN", "auth", "DENEGADO", user=user)
        raise AuthError(403, "Tu cuenta está inactiva. Contacta al administrador.")

    if password_needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
    record_audit(db, "LOGIN", "auth", "EXITOSO", user=user)
    return user


def request_password_reset(db: Session, email: str) -> tuple[str, str, str] | None:
    """Crea un token de recuperación y devuelve (destinatario, asunto, cuerpo) del correo a enviar.

    Devuelve None si el correo no corresponde a un usuario activo; la respuesta al cliente es la misma
    en ambos casos para no revelar qué correos están registrados.
    """
    settings = get_settings()
    user = find_user_by_email(db, email)
    if user is None or user.status != "ACTIVO":
        record_audit(db, "PASSWORD_RESET_REQUEST", "auth", "IGNORADO", email=email.strip().lower())
        return None

    current = now()
    # Solo el último enlace solicitado es válido.
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id, PasswordResetToken.used_at.is_(None)
    ).update({PasswordResetToken.used_at: current})

    token = secrets.token_urlsafe(32)
    db.add(
        PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=current + timedelta(minutes=settings.password_reset_minutes),
        )
    )
    record_audit(db, "PASSWORD_RESET_REQUEST", "auth", "EXITOSO", user=user)

    link = f"{settings.frontend_url}/?reset_token={token}"
    body = (
        f"Hola {user.name}:\n\n"
        "Recibimos una solicitud para restablecer tu contraseña de EcoLogística Lima.\n"
        f"Abre este enlace para elegir una nueva (válido por {settings.password_reset_minutes} minutos):\n\n"
        f"{link}\n\n"
        "Si no solicitaste el cambio, ignora este correo; tu contraseña actual seguirá funcionando."
    )
    return user.email, "Restablece tu contraseña de EcoLogística Lima", body


def confirm_password_reset(db: Session, token: str, new_password: str) -> User:
    current = now()
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == hash_token(token)).first()
    if record is None or record.used_at is not None or record.expires_at <= current:
        raise AuthError(400, INVALID_RESET_TOKEN)

    user = db.get(User, record.user_id)
    if user is None or user.status != "ACTIVO":
        raise AuthError(400, INVALID_RESET_TOKEN)

    user.password_hash = hash_password(new_password)
    user.password_changed_at = current
    # Restablecer la contraseña también levanta un bloqueo por intentos fallidos.
    user.failed_login_attempts = 0
    user.locked_until = None
    record.used_at = current
    record_audit(db, "PASSWORD_RESET", "auth", "EXITOSO", user=user)
    return user
