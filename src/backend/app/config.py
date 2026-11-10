import logging
import os
import secrets
from functools import lru_cache
from urllib.parse import urlsplit

from pydantic import BaseModel

logger = logging.getLogger("uvicorn.error")


class Settings(BaseModel):
    app_name: str = "EcoLogística Lima API"
    environment: str = "development"
    secret_key: str
    access_token_minutes: int = 480  # una jornada laboral
    password_reset_minutes: int = 30  # RF-001: enlace válido por 30 minutos
    max_failed_logins: int = 3  # RN-001
    lockout_minutes: int = 15  # RN-001
    frontend_url: str = "http://localhost:5173"
    cors_allowed_origins: list[str]
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@ecologistica.pe"


@lru_cache
def get_settings() -> Settings:
    environment = os.getenv("ENVIRONMENT", "development").strip().lower()
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        if environment in {"staging", "production"}:
            raise RuntimeError("SECRET_KEY debe estar configurada fuera del entorno de desarrollo.")
        # Sin SECRET_KEY las sesiones se invalidan cada vez que el servidor se reinicia.
        secret_key = secrets.token_urlsafe(48)
        logger.warning("SECRET_KEY no está definida: se generó una clave temporal. Defínela en src/backend/.env.")
    if len(secret_key.encode("utf-8")) < 32:
        raise RuntimeError("SECRET_KEY debe tener al menos 32 bytes.")

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    secure_environment = environment in {"staging", "production"}
    _validate_origin(frontend_url, secure_environment)
    configured_origins = os.getenv("CORS_ALLOWED_ORIGINS", frontend_url)
    cors_allowed_origins = [
        _validate_origin(origin.strip().rstrip("/"), secure_environment)
        for origin in configured_origins.split(",")
        if origin.strip()
    ]
    if not cors_allowed_origins:
        raise RuntimeError("CORS_ALLOWED_ORIGINS debe incluir al menos un origen permitido.")

    smtp_host = os.getenv("SMTP_HOST") or None
    if secure_environment and not smtp_host:
        raise RuntimeError("SMTP_HOST debe estar configurado fuera del entorno de desarrollo.")

    return Settings(
        environment=environment,
        secret_key=secret_key,
        frontend_url=frontend_url,
        cors_allowed_origins=list(dict.fromkeys(cors_allowed_origins)),
        smtp_host=smtp_host,
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER") or None,
        smtp_password=os.getenv("SMTP_PASSWORD") or None,
        smtp_from=os.getenv("SMTP_FROM", "no-reply@ecologistica.pe"),
    )


def _validate_origin(origin: str, secure_environment: bool) -> str:
    parsed = urlsplit(origin)
    if (
        origin == "*"
        or parsed.scheme not in {"http", "https"}
        or not parsed.netloc
        or parsed.path
        or parsed.query
        or parsed.fragment
        or parsed.username
        or parsed.password
    ):
        raise RuntimeError(f"Origen inválido en la configuración CORS: {origin!r}.")
    if secure_environment and parsed.scheme != "https":
        raise RuntimeError("Los orígenes frontend deben usar HTTPS fuera del entorno de desarrollo.")
    return origin
