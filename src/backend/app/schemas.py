import re
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

FuelType = Literal["diesel", "gasolina", "glp", "gnv"]
VehicleStatus = Literal["ACTIVO", "EN_MANTENIMIENTO", "DE_BAJA"]
Role = Literal["ADMINISTRADOR", "DESPACHADOR", "CONDUCTOR", "AUDITOR"]

# Placas peruanas: tres caracteres alfanuméricos y tres más (ej. ABC-123, A1B-234).
PLATE_PATTERN = re.compile(r"^([A-Z0-9]{3})-?([A-Z0-9]{3})$")


def check_password_policy(value: str) -> str:
    if len(value) < 8 or not re.search(r"[A-Za-z]", value) or not re.search(r"\d", value):
        raise ValueError("La contraseña debe tener al menos 8 caracteres e incluir letras y números.")
    return value


def normalize_plate(value: str) -> str:
    plate = value.strip().upper().replace(" ", "")
    match = PLATE_PATTERN.match(plate)
    if not match:
        raise ValueError("La placa debe tener el formato ABC-123.")
    return f"{match.group(1)}-{match.group(2)}"


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=2, max_length=255)
    latitude: float = 0.0
    longitude: float = 0.0
    priority: int = 1


class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    priority: int


class VehicleCreate(BaseModel):
    plate: str
    capacity_kg: float = Field(..., gt=0, le=999999.99)
    fuel_type: FuelType
    # Si no se envía, se usa el factor de referencia del tipo de combustible (kg CO₂/km).
    emission_factor_co2: float | None = Field(None, gt=0, le=999.999)

    @field_validator("plate")
    @classmethod
    def check_plate(cls, value: str) -> str:
        return normalize_plate(value)


class VehicleUpdate(BaseModel):
    plate: str | None = None
    capacity_kg: float | None = Field(None, gt=0, le=999999.99)
    fuel_type: FuelType | None = None
    # Enviar null explícitamente restablece el factor de referencia del combustible.
    emission_factor_co2: float | None = Field(None, gt=0, le=999.999)
    status: VehicleStatus | None = None

    @field_validator("plate")
    @classmethod
    def check_plate(cls, value: str | None) -> str | None:
        return None if value is None else normalize_plate(value)


class VehicleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    plate: str
    capacity_kg: float
    fuel_type: FuelType
    emission_factor_co2: float
    status: VehicleStatus


class RouteStop(BaseModel):
    id: int
    name: str
    lat: float = 0.0
    lng: float = 0.0
    priority: int = 1


class RouteRequest(BaseModel):
    stops: list[RouteStop]
    # Vehículo de la flota; si se envía, sus datos reemplazan fuel_type y emission_factor_kg_km.
    vehicle_id: int | None = None
    fuel_type: FuelType = "diesel"
    # Si se envía, reemplaza el factor por defecto del tipo de combustible (kg CO₂/km).
    emission_factor_kg_km: float | None = Field(None, gt=0)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    role: Role
    status: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # segundos
    user: UserRead


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str = Field(..., min_length=1, max_length=200)
    new_password: str = Field(..., max_length=128)

    @field_validator("new_password")
    @classmethod
    def check_new_password(cls, value: str) -> str:
        return check_password_policy(value)
