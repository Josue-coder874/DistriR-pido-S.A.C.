from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.crud import create_customer, get_customers
from app.database import SessionLocal
from app.models import Customer
from app.schemas import CustomerCreate, CustomerRead, RouteRequest
from app.services.routing_service import RoutingService

router = APIRouter(prefix="/api", tags=["routes"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok"}


@router.get("/customers", response_model=list[CustomerRead])
def list_customers(db: Session = Depends(get_db)) -> list[Customer]:
    return get_customers(db)


@router.post("/customers", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def add_customer(customer: CustomerCreate, db: Session = Depends(get_db)) -> Customer:
    return create_customer(db, customer)


@router.post("/routes/optimize")
def optimize_route(payload: RouteRequest) -> dict:
    service = RoutingService()
    return service.optimize(payload)
