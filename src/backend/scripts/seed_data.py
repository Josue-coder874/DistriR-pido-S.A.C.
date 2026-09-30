from app.database import SessionLocal, init_db
from app.models import Customer

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

print('Datos semilla cargados')
db.close()
