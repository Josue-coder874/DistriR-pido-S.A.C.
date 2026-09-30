from sqlalchemy.orm import Session

from app.models import Customer
from app.schemas import CustomerCreate


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
