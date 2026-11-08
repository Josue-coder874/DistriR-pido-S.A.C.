import pytest

from app.database import SessionLocal
from app.models import AuditLog

ADMIN, DISPATCHER, DRIVER, AUDITOR = "ADMINISTRADOR", "DESPACHADOR", "CONDUCTOR", "AUDITOR"

CUSTOMER = {"name": "Cliente A", "address": "Av. Central 100", "latitude": -12.0464, "longitude": -77.0428}
VEHICLE = {"plate": "ABC-123", "capacity_kg": 1000, "fuel_type": "diesel"}
STOPS = {"stops": [{"id": 1, "name": "Cliente A", "lat": -12.0464, "lng": -77.0428}]}

# Matriz de control de acceso (docs/01 Inicio/08. Usuarios, sección 3).
ENDPOINTS = [
    ("GET", "/api/customers", None, {ADMIN, DISPATCHER, AUDITOR}),
    ("POST", "/api/customers", CUSTOMER, {ADMIN, DISPATCHER}),
    ("DELETE", "/api/customers", None, {ADMIN}),
    ("GET", "/api/vehicles", None, {ADMIN, DISPATCHER, AUDITOR}),
    ("POST", "/api/vehicles", VEHICLE, {ADMIN}),
    ("PATCH", "/api/vehicles/{vehicle_id}", {"capacity_kg": 900}, {ADMIN}),
    ("DELETE", "/api/vehicles/{vehicle_id}", None, {ADMIN}),
    ("POST", "/api/routes/optimize", STOPS, {ADMIN, DISPATCHER}),
]

CASES = [
    pytest.param(method, path, body, role, role in allowed, id=f"{method} {path} as {role}")
    for method, path, body, allowed in ENDPOINTS
    for role in (ADMIN, DISPATCHER, DRIVER, AUDITOR)
]


@pytest.fixture
def vehicle_id(client):
    return client.post("/api/vehicles", json={**VEHICLE, "plate": "XYZ-789"}).json()["id"]


@pytest.mark.parametrize("method, path, body, role, allowed", CASES)
def test_access_matrix(client_as, vehicle_id, method, path, body, role, allowed):
    response = client_as(role).request(method, path.format(vehicle_id=vehicle_id), json=body)

    if allowed:
        assert response.status_code in (200, 201), response.text
    else:
        assert response.status_code == 403
        assert response.json()["detail"] == "No tienes permisos para realizar esta acción."


@pytest.mark.parametrize("method, path, body", [(m, p, b) for m, p, b, _ in ENDPOINTS])
def test_endpoints_require_session(anon_client, method, path, body):
    response = anon_client.request(method, path.format(vehicle_id=1), json=body)

    assert response.status_code == 401


def test_denied_access_is_audited(client_as):
    # RF-010 Ruta Infeliz / RNF-005: el Conductor intenta acceder a la flota.
    client_as(DRIVER).get("/api/vehicles")

    db = SessionLocal()
    rows = [(row.action, row.module, row.result, row.email) for row in db.query(AuditLog)]
    db.close()
    assert rows == [("ACCESS_DENIED:read", "fleet", "DENEGADO", "conductor@distrirapido.pe")]


def test_auditor_is_read_only(client_as, client):
    # RN-010: ninguna operación de creación, actualización o eliminación para el Auditor.
    client.post("/api/customers", json=CUSTOMER)
    auditor = client_as(AUDITOR)

    assert auditor.get("/api/customers").status_code == 200
    assert auditor.post("/api/customers", json=CUSTOMER).status_code == 403
    assert auditor.delete("/api/customers").status_code == 403
    assert auditor.post("/api/vehicles", json=VEHICLE).status_code == 403
    assert len(client.get("/api/customers").json()) == 1
    assert client.get("/api/vehicles").json() == []


def test_denied_request_does_not_change_data(client_as, client):
    client.post("/api/customers", json=CUSTOMER)

    client_as(DISPATCHER).delete("/api/customers")

    assert len(client.get("/api/customers").json()) == 1
