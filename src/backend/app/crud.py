from sqlalchemy.orm import Session

from app.models import Customer, Vehicle
from app.schemas import CustomerCreate, VehicleCreate, VehicleUpdate
from app.services.routing_service import EMISSION_FACTORS_KG_PER_KM


def get_customers(db: Session) -> list[Customer]:
    return db.query(Customer).order_by(Customer.id).all()


def create_customer(db: Session, customer: CustomerCreate) -> Customer:
    new_customer = Customer(
        name=customer.name,
        address=customer.address,
        latitude=customer.latitude,
        longitude=customer.longitude,
        priority=customer.priority,
    )
    db.add(new_customer)
    db.commit()
    db.refresh(new_customer)
    return new_customer


def delete_all_customers(db: Session) -> int:
    deleted = db.query(Customer).delete()
    db.commit()
    return deleted


def get_vehicles(db: Session, include_retired: bool = False) -> list[Vehicle]:
    query = db.query(Vehicle)
    if not include_retired:
        query = query.filter(Vehicle.status != "DE_BAJA")
    return query.order_by(Vehicle.id).all()


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
