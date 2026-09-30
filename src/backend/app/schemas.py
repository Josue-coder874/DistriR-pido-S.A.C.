from pydantic import BaseModel, Field


class CustomerCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    address: str = Field(..., min_length=2, max_length=255)
    latitude: float = 0.0
    longitude: float = 0.0
    priority: int = 1


class CustomerRead(BaseModel):
    id: int
    name: str
    address: str
    latitude: float
    longitude: float
    priority: int


class RouteStop(BaseModel):
    id: int
    name: str
    lat: float = 0.0
    priority: int = 1


class RouteRequest(BaseModel):
    stops: list[RouteStop]
