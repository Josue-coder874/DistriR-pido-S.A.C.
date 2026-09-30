from functools import lru_cache
from pathlib import Path

from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "EcoLogística Lima API"
    environment: str = "development"
    database_url: str = "postgresql://postgres:postgres@localhost:5432/ecologistica"


@lru_cache

def get_settings() -> Settings:
    return Settings()
