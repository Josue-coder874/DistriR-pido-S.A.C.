import pytest

CUSTOMERS = [
    {"name": "Cliente A", "address": "Av. Central 100", "latitude": -12.0464, "longitude": -77.0428, "priority": 1, "demand_kg": 1},
    {"name": "Cliente B", "address": "Jr. Los Pinos 220", "latitude": -12.0526, "longitude": -77.0450, "priority": 2, "demand_kg": 1},
    {"name": "Cliente C", "address": "Calle San Martín 35", "latitude": -12.0589, "longitude": -77.0472, "priority": 3, "demand_kg": 1},
]


def test_delete_customers_removes_all(client):
    for customer in CUSTOMERS:
        assert client.post("/api/customers", json=customer).status_code == 201
    assert len(client.get("/api/customers").json()) == 3

    response = client.delete("/api/customers")

    assert response.status_code == 200
    assert response.json() == {"deleted": 3}
    assert client.get("/api/customers").json() == []


def test_delete_customers_when_empty(client):
    response = client.delete("/api/customers")

    assert response.status_code == 200
    assert response.json() == {"deleted": 0}
    assert client.get("/api/customers").json() == []


def test_can_register_customers_after_delete(client):
    client.post("/api/customers", json=CUSTOMERS[0])
    client.delete("/api/customers")

    assert client.post("/api/customers", json=CUSTOMERS[1]).status_code == 201
    names = [c["name"] for c in client.get("/api/customers").json()]
    assert names == ["Cliente B"]


def test_optimize_after_delete_returns_empty_route(client):
    client.post("/api/customers", json=CUSTOMERS[0])
    client.delete("/api/customers")

    data = client.post("/api/routes/optimize", json={"stops": []}).json()

    assert data["route"] == []
    assert data["total_distance_km"] == 0
    assert data["estimated_time_minutes"] == 0
    assert data["total_cost"] == 0
    assert data["total_co2_kg"] == 0


def test_customer_delivery_window_is_saved_and_returned(client):
    response = client.post(
        "/api/customers",
        json={**CUSTOMERS[0], "window_start": "09:00", "window_end": "11:30"},
    )

    assert response.status_code == 201
    assert response.json()["window_start"] == "09:00:00"
    assert response.json()["window_end"] == "11:30:00"
    assert client.get("/api/customers").json()[0]["window_start"] == "09:00:00"


@pytest.mark.parametrize("demand", [0, -1])
def test_customer_order_requires_positive_demand(client, demand):
    response = client.post("/api/customers", json={**CUSTOMERS[0], "demand_kg": demand})

    assert response.status_code == 422
    assert client.get("/api/customers").json() == []


def test_customer_demand_can_be_updated_for_route_planning(client):
    response = client.post("/api/customers", json=CUSTOMERS[0])
    customer_id = response.json()["id"]

    updated = client.patch(f"/api/customers/{customer_id}", json={"demand_kg": 25.5})

    assert updated.status_code == 200
    assert updated.json()["demand_kg"] == 25.5
    assert client.get("/api/customers").json()[0]["demand_kg"] == 25.5


def test_customer_demand_update_validates_positive_weight(client):
    customer = client.post("/api/customers", json=CUSTOMERS[0]).json()

    assert client.patch(f"/api/customers/{customer['id']}", json={"demand_kg": 0}).status_code == 422
    assert client.patch("/api/customers/999", json={"demand_kg": 10}).status_code == 404


def test_customers_can_be_listed_in_stable_pages(client):
    for index in range(13):
        response = client.post(
            "/api/customers",
            json={**CUSTOMERS[index % len(CUSTOMERS)], "name": f"Cliente {index + 1}"},
        )
        assert response.status_code == 201

    first_page = client.get("/api/customers", params={"page_size": 12})
    last_page = client.get("/api/customers", params={"page": 2, "page_size": 12})

    assert first_page.status_code == 200
    assert first_page.json()["total"] == 13
    assert first_page.json()["page"] == 1
    assert first_page.json()["page_size"] == 12
    assert first_page.json()["total_pages"] == 2
    assert len(first_page.json()["items"]) == 12
    assert last_page.json()["items"][0]["id"] > first_page.json()["items"][-1]["id"]
    assert len(last_page.json()["items"]) == 1
    assert client.get("/api/customers", params={"page": 3, "page_size": 12}).json()["items"] == []
    assert isinstance(client.get("/api/customers").json(), list)


@pytest.mark.parametrize("params", [{"page": 0}, {"page_size": 0}, {"page_size": 101}])
def test_customer_pagination_rejects_invalid_parameters(client, params):
    assert client.get("/api/customers", params=params).status_code == 422


def test_optimizer_uses_all_customers_when_stops_are_omitted(client):
    assert client.post("/api/vehicles", json={
        "plate": "AAA-111",
        "capacity_kg": 1000,
        "fuel_type": "diesel",
    }).status_code == 201
    expected_names = {f"Cliente {index + 1}" for index in range(13)}
    for index in range(13):
        customer = {**CUSTOMERS[index % len(CUSTOMERS)], "name": f"Cliente {index + 1}"}
        assert client.post("/api/customers", json=customer).status_code == 201

    response = client.post("/api/routes/optimize", json={})

    assert response.status_code == 200
    route_stops = response.json()["route_stops"]
    assert len(route_stops) == 13
    assert {stop["name"] for stop in route_stops} == expected_names


@pytest.mark.parametrize(
    "window",
    [
        {"window_start": "09:00"},
        {"window_end": "11:00"},
        {"window_start": "11:00", "window_end": "09:00"},
        {"window_start": "09:00", "window_end": "09:00"},
    ],
)
def test_invalid_customer_delivery_window_is_rejected(client, window):
    response = client.post("/api/customers", json={**CUSTOMERS[0], **window})

    assert response.status_code == 422
    assert client.get("/api/customers").json() == []


def test_optimizer_respects_delivery_windows(client):
    client.post("/api/vehicles", json={"plate": "AAA-111", "capacity_kg": 100, "fuel_type": "diesel"})
    stops = [
        {"id": 1, "name": "Entrega tardía", "lat": -12.05, "lng": -77.04, "priority": 1, "demand_kg": 1,
         "window_start": "09:00", "window_end": "10:00"},
        {"id": 2, "name": "Entrega temprana", "lat": -12.05, "lng": -77.04, "priority": 2, "demand_kg": 1,
         "window_start": "08:00", "window_end": "08:30"},
    ]

    response = client.post("/api/routes/optimize", json={"stops": stops})

    assert response.status_code == 200
    assert response.json()["route"] == ["Entrega temprana", "Entrega tardía"]


def test_optimizer_rejects_incomplete_delivery_window(client):
    response = client.post(
        "/api/routes/optimize",
        json={"stops": [{"id": 1, "name": "Entrega", "demand_kg": 1, "window_start": "09:00"}]},
    )

    assert response.status_code == 422


def test_optimizer_rejects_route_that_cannot_meet_delivery_windows(client):
    client.post("/api/vehicles", json={"plate": "AAA-111", "capacity_kg": 100, "fuel_type": "diesel"})
    stops = [
        {"id": 1, "name": "Primera", "lat": -12.05, "lng": -77.04, "demand_kg": 1, "window_start": "09:00", "window_end": "09:05"},
        {"id": 2, "name": "Segunda", "lat": -12.05, "lng": -77.04, "demand_kg": 1, "window_start": "09:00", "window_end": "09:05"},
    ]

    response = client.post("/api/routes/optimize", json={"stops": stops})

    assert response.status_code == 200
    result = response.json()
    assert result["unassigned"]
    assert all(
        stop["reason"] == "VENTANA_HORARIA_INFACTIBLE_O_TIEMPO_AGOTADO"
        for stop in result["unassigned"]
    )


def test_init_db_adds_delivery_window_columns_to_existing_sqlite_database(tmp_path, monkeypatch):
    from sqlalchemy import create_engine, inspect

    import app.database as database

    legacy_engine = create_engine(f"sqlite:///{tmp_path / 'legacy.db'}")
    with legacy_engine.begin() as connection:
        connection.exec_driver_sql(
            "CREATE TABLE customers (id INTEGER PRIMARY KEY, name VARCHAR(200) NOT NULL, "
            "address VARCHAR(255) NOT NULL, latitude FLOAT, longitude FLOAT, priority INTEGER)"
        )
    monkeypatch.setattr(database, "engine", legacy_engine)

    database.init_db()

    with legacy_engine.connect() as connection:
        columns = {column["name"] for column in inspect(connection).get_columns("customers")}
    legacy_engine.dispose()
    assert {"window_start", "window_end", "demand_kg"} <= columns
