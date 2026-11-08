CUSTOMERS = [
    {"name": "Cliente A", "address": "Av. Central 100", "latitude": -12.0464, "longitude": -77.0428, "priority": 1},
    {"name": "Cliente B", "address": "Jr. Los Pinos 220", "latitude": -12.0526, "longitude": -77.0450, "priority": 2},
    {"name": "Cliente C", "address": "Calle San Martín 35", "latitude": -12.0589, "longitude": -77.0472, "priority": 3},
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
