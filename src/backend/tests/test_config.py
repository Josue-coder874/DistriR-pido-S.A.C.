import pytest

from app.config import get_settings


@pytest.fixture
def clean_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def set_development_env(monkeypatch, **overrides):
    secure_environment = overrides.get("ENVIRONMENT") in {"staging", "production"}
    values = {
        "ENVIRONMENT": overrides.get("ENVIRONMENT", "development"),
        "SECRET_KEY": "test-secret-key-for-jwt-signing-at-least-32-bytes",
        "FRONTEND_URL": "https://app.example.com" if secure_environment else "http://localhost:5173",
        "CORS_ALLOWED_ORIGINS": "https://app.example.com" if secure_environment else "http://localhost:5173",
        "SMTP_HOST": "smtp.example.com" if secure_environment else "",
    }
    values.update(overrides)
    for key, value in values.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()


def test_development_settings_allow_only_configured_frontend(monkeypatch, clean_settings_cache):
    set_development_env(monkeypatch, CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:4173")

    settings = get_settings()

    assert settings.cors_allowed_origins == ["http://localhost:5173", "http://localhost:4173"]


@pytest.mark.parametrize(
    "environment, overrides, error",
    [
        ("production", {"SECRET_KEY": ""}, "SECRET_KEY debe estar configurada"),
        ("production", {"SECRET_KEY": "short"}, "SECRET_KEY debe tener al menos 32 bytes"),
        ("production", {"FRONTEND_URL": "http://app.example.com"}, "deben usar HTTPS"),
        ("production", {"CORS_ALLOWED_ORIGINS": "*"}, "Origen inválido"),
        ("production", {"CORS_ALLOWED_ORIGINS": "http://app.example.com"}, "deben usar HTTPS"),
        ("staging", {"SMTP_HOST": ""}, "SMTP_HOST debe estar configurado"),
    ],
)
def test_secure_environment_rejects_unsafe_configuration(
    monkeypatch, clean_settings_cache, environment, overrides, error
):
    set_development_env(monkeypatch, ENVIRONMENT=environment, **overrides)

    with pytest.raises(RuntimeError, match=error):
        get_settings()


def test_secure_environment_accepts_strong_key_https_origins_and_smtp(monkeypatch, clean_settings_cache):
    set_development_env(
        monkeypatch,
        ENVIRONMENT="production",
        SECRET_KEY="production-signing-key-with-at-least-32-bytes",
        FRONTEND_URL="https://app.example.com",
        CORS_ALLOWED_ORIGINS="https://app.example.com,https://admin.example.com",
        SMTP_HOST="smtp.example.com",
    )

    settings = get_settings()

    assert settings.cors_allowed_origins == ["https://app.example.com", "https://admin.example.com"]
    assert settings.smtp_host == "smtp.example.com"
