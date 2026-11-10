from math import ceil

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.models import Customer, Vehicle
from app.schemas import (
    CustomerCreate,
    CustomerDemandUpdate,
    CustomerPage,
    CustomerRead,
    RouteRequest,
    RouteStop,
    VehicleCreate,
    VehiclePage,
    VehicleRead,
    VehicleUpdate,
)
from app.security import require_permission
from app.services.routing_service import RoutingService

router = APIRouter(prefix="/api")
routing_service = RoutingService()

STATUS_LABELS = {"ACTIVO": "activo", "EN_MANTENIMIENTO": "en mantenimiento", "DE_BAJA": "de baja"}


def duplicate_plate_error(plate: str) -> HTTPException:
    return HTTPException(status_code=409, detail=f"Ya existe un vehículo con la placa {plate}.")


def get_vehicle_or_404(db: Session, vehicle_id: int) -> Vehicle:
    vehicle = crud.get_vehicle(db, vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehículo no encontrado.")
    return vehicle


@router.get(
    "/customers",
    response_model=list[CustomerRead] | CustomerPage,
    dependencies=[Depends(require_permission("customers", "read"))],
)
def list_customers(
    page: int | None = Query(None, ge=1),
    page_size: int | None = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if page is None and page_size is None:
        return crud.get_customers(db)

    current_page = page or 1
    current_page_size = page_size or 12
    items, total = crud.get_customers_page(db, current_page, current_page_size)
    return {
        "items": items,
        "total": total,
        "page": current_page,
        "page_size": current_page_size,
        "total_pages": ceil(total / current_page_size),
    }


@router.post(
    "/customers",
    response_model=CustomerRead,
    status_code=201,
    dependencies=[Depends(require_permission("customers", "write"))],
)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    return crud.create_customer(db, customer)


@router.patch(
    "/customers/{customer_id}",
    response_model=CustomerRead,
    dependencies=[Depends(require_permission("customers", "write"))],
)
def update_customer_demand(
    customer_id: int,
    changes: CustomerDemandUpdate,
    db: Session = Depends(get_db),
):
    customer = db.get(Customer, customer_id)
    if customer is None:
        raise HTTPException(status_code=404, detail="Pedido no encontrado.")
    return crud.update_customer_demand(db, customer, changes.demand_kg)


@router.delete("/customers", dependencies=[Depends(require_permission("customers", "purge"))])
def delete_customers(db: Session = Depends(get_db)) -> dict:
    return {"deleted": crud.delete_all_customers(db)}


@router.get(
    "/vehicles",
    response_model=list[VehicleRead] | VehiclePage,
    dependencies=[Depends(require_permission("fleet", "read"))],
)
def list_vehicles(
    include_retired: bool = False,
    page: int | None = Query(None, ge=1),
    page_size: int | None = Query(None, ge=1, le=100),
    db: Session = Depends(get_db),
):
    if page is None and page_size is None:
        return crud.get_vehicles(db, include_retired)

    current_page = page or 1
    current_page_size = page_size or 12
    items, total = crud.get_vehicles_page(db, current_page, current_page_size, include_retired)
    return {
        "items": items,
        "total": total,
        "page": current_page,
        "page_size": current_page_size,
        "total_pages": ceil(total / current_page_size),
    }


@router.post(
    "/vehicles",
    response_model=VehicleRead,
    status_code=201,
    dependencies=[Depends(require_permission("fleet", "write"))],
)
def create_vehicle(vehicle: VehicleCreate, db: Session = Depends(get_db)):
    if crud.get_vehicle_by_plate(db, vehicle.plate):
        raise duplicate_plate_error(vehicle.plate)
    try:
        return crud.create_vehicle(db, vehicle)
    except IntegrityError:
        db.rollback()
        raise duplicate_plate_error(vehicle.plate)


@router.patch(
    "/vehicles/{vehicle_id}",
    response_model=VehicleRead,
    dependencies=[Depends(require_permission("fleet", "write"))],
)
def update_vehicle(vehicle_id: int, changes: VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = get_vehicle_or_404(db, vehicle_id)
    if changes.plate and changes.plate != vehicle.plate and crud.get_vehicle_by_plate(db, changes.plate):
        raise duplicate_plate_error(changes.plate)
    try:
        return crud.update_vehicle(db, vehicle, changes)
    except IntegrityError:
        db.rollback()
        raise duplicate_plate_error(changes.plate)


@router.delete(
    "/vehicles/{vehicle_id}",
    response_model=VehicleRead,
    dependencies=[Depends(require_permission("fleet", "write"))],
)
def retire_vehicle(vehicle_id: int, db: Session = Depends(get_db)):
    # Baja lógica: el vehículo se conserva para el historial de rutas.
    vehicle = get_vehicle_or_404(db, vehicle_id)
    return crud.update_vehicle(db, vehicle, VehicleUpdate(status="DE_BAJA"))


@router.post("/routes/optimize", dependencies=[Depends(require_permission("routes", "create"))])
def optimize_route(payload: RouteRequest, db: Session = Depends(get_db)) -> dict:
    vehicle = None
    if payload.vehicle_id is not None:
        vehicle = get_vehicle_or_404(db, payload.vehicle_id)
        if vehicle.status != "ACTIVO":
            raise HTTPException(
                status_code=409,
                detail=f"El vehículo {vehicle.plate} está {STATUS_LABELS[vehicle.status]} y no puede asignarse a rutas.",
            )
    if payload.stops is None:
        payload = payload.model_copy(
            update={
                "stops": [
                    RouteStop(
                        id=customer.id,
                        name=customer.name,
                        lat=customer.latitude,
                        lng=customer.longitude,
                        priority=customer.priority,
                        demand_kg=customer.demand_kg,
                        window_start=customer.window_start,
                        window_end=customer.window_end,
                    )
                    for customer in crud.get_customers(db)
                ]
            }
        )

    try:
        available_vehicles = [vehicle] if vehicle else crud.get_vehicles(db)
        result = routing_service.optimize(payload, available_vehicles)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    if vehicle and not result.get("vehicle"):
        result["vehicle"] = {"id": vehicle.id, "plate": vehicle.plate}
    else:
        result.setdefault("vehicle", None)
    return result
