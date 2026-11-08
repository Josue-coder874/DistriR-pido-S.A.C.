import hashlib
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models import User
from app.services.audit_service import record_audit

ROLE_ADMIN = "ADMINISTRADOR"
ROLE_DISPATCHER = "DESPACHADOR"
ROLE_DRIVER = "CONDUCTOR"
ROLE_AUDITOR = "AUDITOR"
ROLES = (ROLE_ADMIN, ROLE_DISPATCHER, ROLE_DRIVER, ROLE_AUDITOR)

# Matriz de control de acceso (docs/01 Inicio/08. Usuarios, sección 3).
PERMISSIONS = {
    # "Registro de pedidos": los clientes son hoy los puntos de entrega.
    ("customers", "read"): {ROLE_ADMIN, ROLE_DISPATCHER, ROLE_AUDITOR},
    ("customers", "write"): {ROLE_ADMIN, ROLE_DISPATCHER},
    # "Depuración / eliminación física de registros": solo Administrador.
    ("customers", "purge"): {ROLE_ADMIN},
    ("fleet", "read"): {ROLE_ADMIN, ROLE_DISPATCHER, ROLE_AUDITOR},
    ("fleet", "write"): {ROLE_ADMIN},
    ("routes", "create"): {ROLE_ADMIN, ROLE_DISPATCHER},
}

JWT_ALGORITHM = "HS256"

_password_hasher = PasswordHasher()
# Hash de referencia para que un correo inexistente tarde lo mismo que uno válido.
_DUMMY_HASH = _password_hasher.hash("ecologistica-dummy-password")


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def verify_dummy_password(password: str) -> None:
    verify_password(_DUMMY_HASH, password)


def password_needs_rehash(password_hash: str) -> bool:
    return _password_hasher.check_needs_rehash(password_hash)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def create_access_token(user: User) -> str:
    settings = get_settings()
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "role": user.role,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=JWT_ALGORITHM)


_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401,
        detail="Sesión no válida o expirada. Inicia sesión nuevamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if credentials is None:
        raise unauthorized
    try:
        payload = jwt.decode(
            credentials.credentials,
            get_settings().secret_key,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "iat", "sub"]},
        )
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, ValueError):
        raise unauthorized

    # El rol y el estado se leen de la base de datos: un usuario desactivado pierde el acceso de inmediato.
    if user is None or user.status != "ACTIVO":
        raise unauthorized
    # Los tokens emitidos antes de un cambio de contraseña dejan de ser válidos.
    password_changed = int(user.password_changed_at.replace(tzinfo=timezone.utc).timestamp())
    if payload["iat"] < password_changed:
        raise unauthorized
    return user


def require_permission(module: str, action: str):
    allowed_roles = PERMISSIONS[(module, action)]

    def dependency(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
        if user.role not in allowed_roles:
            # RF-010 / RNF-005: el intento denegado queda en el log de auditoría.
            record_audit(db, action=f"ACCESS_DENIED:{action}", module=module, result="DENEGADO", user=user)
            raise HTTPException(status_code=403, detail="No tienes permisos para realizar esta acción.")
        return user

    return dependency
