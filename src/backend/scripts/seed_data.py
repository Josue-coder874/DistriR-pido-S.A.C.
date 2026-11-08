from app.database import SessionLocal, init_db
from app.models import Customer, Vehicle

init_db()
db = SessionLocal()

sample = [
    Customer(name='Cliente A', address='Av. Central 100', latitude=-12.0464, longitude=-77.0428, priority=1),
    Customer(name='Cliente B', address='Jr. Los Pinos 220', latitude=-12.0526, longitude=-77.0450, priority=2),
    Customer(name='Cliente C', address='Calle San Martín 35', latitude=-12.0589, longitude=-77.0472, priority=3),
    Customer(name='Cliente D', address='Av. Brasil 480', latitude=-12.0748, longitude=-77.0532, priority=4),
]

existing = db.query(Customer).count()
if existing == 0:
    db.add_all(sample)
    db.commit()

vehicles = [
    Vehicle(plate='ABC-123', capacity_kg=1000, fuel_type='diesel', emission_factor_co2=0.27, status='ACTIVO'),
    Vehicle(plate='GNV-456', capacity_kg=800, fuel_type='gnv', emission_factor_co2=0.19, status='ACTIVO'),
]

if db.query(Vehicle).count() == 0:
    db.add_all(vehicles)
    db.commit()

print('Datos semilla cargados')
db.close()
