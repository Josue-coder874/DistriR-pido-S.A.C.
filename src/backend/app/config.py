import logging
import os
import secrets
from functools import lru_cache

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
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    smtp_from: str = "no-reply@ecologistica.pe"


@lru_cache
def get_settings() -> Settings:
    secret_key = os.getenv("SECRET_KEY")
    if not secret_key:
        # Sin SECRET_KEY las sesiones se invalidan cada vez que el servidor se reinicia.
        secret_key = secrets.token_urlsafe(48)
        logger.warning("SECRET_KEY no está definida: se generó una clave temporal. Defínela en src/backend/.env.")

    return Settings(
        environment=os.getenv("ENVIRONMENT", "development"),
        secret_key=secret_key,
        frontend_url=os.getenv("FRONTEND_URL", "http://localhost:5173"),
        smtp_host=os.getenv("SMTP_HOST") or None,
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER") or None,
        smtp_password=os.getenv("SMTP_PASSWORD") or None,
        smtp_from=os.getenv("SMTP_FROM", "no-reply@ecologistica.pe"),
    )
