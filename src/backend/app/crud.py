from sqlalchemy.orm import Session

from app.models import Customer, Vehicle
from app.schemas import CustomerCreate, VehicleCreate, VehicleUpdate
from app.services.routing_service import EMISSION_FACTORS_KG_PER_KM


def get_customers(db: Session) -> list[Customer]:
    return db.query(Customer).order_by(Customer.id).all()


def get_customers_page(db: Session, page: int, page_size: int) -> tuple[list[Customer], int]:
    query = db.query(Customer)
    total = query.count()
    items = query.order_by(Customer.id).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    new_customer = Customer(
        name=customer.name,
        address=customer.address,
        latitude=customer.latitude,
        longitude=customer.longitude,
        priority=customer.priority,
        demand_kg=customer.demand_kg,
        window_start=customer.window_start,
        window_end=customer.window_end,
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


def update_customer_demand(db: Session, customer: Customer, demand_kg: float) -> Customer:
    customer.demand_kg = demand_kg
    db.commit()
    db.refresh(customer)
    return customer


def delete_all_customers(db: Session) -> int:
    deleted = db.query(Customer).delete()
    db.commit()
    return deleted


def get_vehicles(db: Session, include_retired: bool = False) -> list[Vehicle]:
    query = db.query(Vehicle)
    if not include_retired:
        query = query.filter(Vehicle.status != "DE_BAJA")
    return query.order_by(Vehicle.id).all()


def get_vehicles_page(
    db: Session, page: int, page_size: int, include_retired: bool = False
) -> tuple[list[Vehicle], int]:
    query = db.query(Vehicle)
    if not include_retired:
        query = query.filter(Vehicle.status != "DE_BAJA")
    total = query.count()
    items = query.order_by(Vehicle.id).offset((page - 1) * page_size).limit(page_size).all()
    return items, total


def get_vehicle(db: Session, vehicle_id: int) -> Vehicle | None:
    return db.get(Vehicle, vehicle_id)


def get_vehicle_by_plate(db: Session, plate: str) -> Vehicle | None:
    return db.query(Vehicle).filter(Vehicle.plate == plate).first()


def create_vehicle(db: Session, vehicle: VehicleCreate) -> Vehicle:
    new_vehicle = Vehicle(
        plate=vehicle.plate,
        capacity_kg=vehicle.capacity_kg,
        fuel_type=vehicle.fuel_type,
        emission_factor_co2=vehicle.emission_factor_co2 or EMISSION_FACTORS_KG_PER_KM[vehicle.fuel_type],
        status="ACTIVO",
    )
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    return new_vehicle


def update_vehicle(db: Session, vehicle: Vehicle, changes: VehicleUpdate) -> Vehicle:
    data = changes.model_dump(exclude_unset=True)
    reset_factor = "emission_factor_co2" in data and data["emission_factor_co2"] is None
    for field, value in data.items():
        if value is not None:
            setattr(vehicle, field, value)
    if reset_factor:
        vehicle.emission_factor_co2 = EMISSION_FACTORS_KG_PER_KM[vehicle.fuel_type]
    db.commit()
    db.refresh(vehicle)
    return vehicle
