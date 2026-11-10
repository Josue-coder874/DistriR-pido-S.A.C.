from time import perf_counter

import pytest

VEHICLE = {"plate": "ABC-123", "capacity_kg": 1000, "fuel_type": "diesel", "emission_factor_co2": 0.3}

STOPS = [
    {"id": 1, "name": "Cliente A", "lat": -12.0464, "lng": -77.0428, "priority": 1, "demand_kg": 100},
    {"id": 2, "name": "Cliente B", "lat": -12.0526, "lng": -77.0450, "priority": 2, "demand_kg": 100},
    {"id": 3, "name": "Cliente C", "lat": -12.0589, "lng": -77.0472, "priority": 3, "demand_kg": 100},
]


def create_vehicle(client, **overrides):
    response = client.post("/api/vehicles", json={**VEHICLE, **overrides})
    assert response.status_code == 201, response.text
    return response.json()


# --- Registro (Ruta Gold de RF-002)


def test_create_vehicle_is_saved_as_active(client):
    vehicle = create_vehicle(client)

    assert vehicle["plate"] == "ABC-123"
    assert vehicle["capacity_kg"] == 1000
    assert vehicle["fuel_type"] == "diesel"
    assert vehicle["emission_factor_co2"] == 0.3
    assert vehicle["status"] == "ACTIVO"
    assert client.get("/api/vehicles").json() == [vehicle]


def test_create_vehicle_without_factor_uses_fuel_reference(client):
    vehicle = create_vehicle(client, fuel_type="gnv", emission_factor_co2=None)

    assert vehicle["emission_factor_co2"] == 0.19


@pytest.mark.parametrize("raw, expected", [("abc123", "ABC-123"), (" a1b-234 ", "A1B-234")])
def test_plate_is_normalized(client, raw, expected):
    assert create_vehicle(client, plate=raw)["plate"] == expected


# --- Placa duplicada (Ruta Infeliz de RF-002)


@pytest.mark.parametrize("duplicate", ["ABC-123", "abc123"])
def test_duplicate_plate_is_rejected(client, duplicate):
    create_vehicle(client)

    response = client.post("/api/vehicles", json={**VEHICLE, "plate": duplicate})

    assert response.status_code == 409
    assert response.json()["detail"] == "Ya existe un vehículo con la placa ABC-123."
    assert len(client.get("/api/vehicles").json()) == 1


def test_update_to_existing_plate_is_rejected(client):
    create_vehicle(client)
    other = create_vehicle(client, plate="XYZ-789")

    response = client.patch(f"/api/vehicles/{other['id']}", json={"plate": "ABC-123"})

    assert response.status_code == 409
    assert client.get("/api/vehicles").json()[1]["plate"] == "XYZ-789"


# --- Validaciones


@pytest.mark.parametrize(
    "field, value",
    [
        ("plate", "AB-12"),
        ("plate", "ABCD-1234"),
        ("capacity_kg", 0),
        ("capacity_kg", -10),
        ("fuel_type", "kerosene"),
        ("emission_factor_co2", 0),
        ("emission_factor_co2", -0.1),
    ],
)
def test_invalid_vehicle_is_rejected(client, field, value):
    response = client.post("/api/vehicles", json={**VEHICLE, field: value})

    assert response.status_code == 422
    assert client.get("/api/vehicles").json() == []


# --- Modificación y baja


def test_update_vehicle_fields(client):
    vehicle = create_vehicle(client)

    response = client.patch(
        f"/api/vehicles/{vehicle['id']}",
        json={"plate": "XYZ-789", "capacity_kg": 1500, "fuel_type": "glp", "emission_factor_co2": 0.22},
    )

    assert response.status_code == 200
    data = response.json()
    assert (data["plate"], data["capacity_kg"], data["fuel_type"], data["emission_factor_co2"]) == (
        "XYZ-789",
        1500,
        "glp",
        0.22,
    )


def test_update_with_null_factor_restores_fuel_reference(client):
    vehicle = create_vehicle(client)

    data = client.patch(
        f"/api/vehicles/{vehicle['id']}", json={"fuel_type": "gasolina", "emission_factor_co2": None}
    ).json()

    assert data["emission_factor_co2"] == 0.25


def test_partial_update_keeps_other_fields(client):
    vehicle = create_vehicle(client)

    data = client.patch(f"/api/vehicles/{vehicle['id']}", json={"capacity_kg": 750}).json()

    assert data == {**vehicle, "capacity_kg": 750}


def test_retire_vehicle_is_logical_delete(client):
    vehicle = create_vehicle(client)

    response = client.delete(f"/api/vehicles/{vehicle['id']}")

    assert response.status_code == 200
    assert response.json()["status"] == "DE_BAJA"
    assert client.get("/api/vehicles").json() == []
    retired = client.get("/api/vehicles", params={"include_retired": True}).json()
    assert [v["status"] for v in retired] == ["DE_BAJA"]


def test_vehicles_can_be_listed_in_pages_without_including_retired(client):
    vehicles = [
        create_vehicle(client, plate=f"A{index:02d}-{index:03d}")
        for index in range(13)
    ]
    client.delete(f"/api/vehicles/{vehicles[-1]['id']}")

    first_page = client.get("/api/vehicles", params={"page_size": 12}).json()
    last_page = client.get("/api/vehicles", params={"page": 2, "page_size": 12}).json()
    including_retired = client.get(
        "/api/vehicles", params={"page": 2, "page_size": 12, "include_retired": True}
    ).json()

    assert first_page["total"] == 12
    assert len(first_page["items"]) == 12
    assert last_page["items"] == []
    assert including_retired["total"] == 13
    assert including_retired["items"][0]["status"] == "DE_BAJA"
    assert isinstance(client.get("/api/vehicles").json(), list)


def test_unknown_vehicle_returns_404(client):
    assert client.patch("/api/vehicles/999", json={"capacity_kg": 10}).status_code == 404
    assert client.delete("/api/vehicles/999").status_code == 404


def test_clearing_customers_keeps_vehicles(client):
    create_vehicle(client)

    client.delete("/api/customers")

    assert len(client.get("/api/vehicles").json()) == 1


# --- Uso en la optimización (RN-006, RN-007 y Ruta Feliz de RF-002)


def test_optimize_uses_vehicle_fuel_and_emission_factor(client):
    vehicle = create_vehicle(client, fuel_type="gnv", emission_factor_co2=0.5)

    data = client.post("/api/routes/optimize", json={"stops": STOPS, "vehicle_id": vehicle["id"]}).json()

    assert data["vehicle"] == {"id": vehicle["id"], "plate": "ABC-123"}
    assert data["fuel_type"] == "gnv"
    assert data["emission_factor_kg_km"] == 0.5
    assert data["route_stops"]
    assert [stop["name"] for stop in data["route_stops"]] == data["route"]
    assert data["total_co2_kg"] == pytest.approx(data["total_distance_km"] * 0.5, abs=0.01)
    # RN-006: el combustible del vehículo (GNV, 0.10 m³/km × S/ 1.90) define el costo de combustible.
    assert data["fuel_cost"] == pytest.approx(data["total_distance_km"] * 0.10 * 1.90, abs=0.01)
    assert data["routes"][0]["load_kg"] == 300
    assert data["unassigned"] == []


def test_optimizer_assigns_orders_across_active_vehicles_with_capacity(client):
    first = create_vehicle(client, plate="AAA-111", capacity_kg=100)
    second = create_vehicle(client, plate="BBB-222", capacity_kg=200)
    stops = [
        {"id": 1, "name": "Pedido 1", "lat": -12.05, "lng": -77.04, "demand_kg": 75},
        {"id": 2, "name": "Pedido 2", "lat": -12.051, "lng": -77.041, "demand_kg": 75},
        {"id": 3, "name": "Pedido 3", "lat": -12.052, "lng": -77.042, "demand_kg": 75},
    ]

    response = client.post("/api/routes/optimize", json={"stops": stops})

    assert response.status_code == 200, response.text
    result = response.json()
    assert {route["vehicle"]["id"] for route in result["routes"]} == {first["id"], second["id"]}
    assert {stop["id"] for route in result["routes"] for stop in route["route_stops"]} == {1, 2, 3}
    assert all(route["load_kg"] <= route["capacity_kg"] for route in result["routes"])
    assert result["unassigned"] == []


def test_optimizer_reports_overweight_and_combined_capacity_shortfall(client):
    create_vehicle(client, capacity_kg=100)
    stops = [
        {"id": 1, "name": "Pedido asignable", "demand_kg": 60},
        {"id": 2, "name": "Pedido excedente", "demand_kg": 60},
        {"id": 3, "name": "Pedido demasiado pesado", "demand_kg": 120},
    ]

    result = client.post("/api/routes/optimize", json={"stops": stops}).json()

    assert len(result["route_stops"]) == 1
    assert len(result["unassigned"]) == 2
    reasons = {item["reason"] for item in result["unassigned"]}
    assert reasons == {"CAPACIDAD_COMBINADA_INSUFICIENTE", "DEMANDA_SUPERA_CAPACIDAD_VEHICULO"}
    assert all(item["detail"] for item in result["unassigned"])


def test_optimizer_reports_legacy_orders_without_registered_demand(client):
    create_vehicle(client, capacity_kg=1000)
    response = client.post(
        "/api/routes/optimize",
        json={"stops": [{"id": 99, "name": "Pedido antiguo", "demand_kg": None}]},
    )

    assert response.status_code == 200
    result = response.json()
    assert result["route_stops"] == []
    assert result["unassigned"][0]["reason"] == "DEMANDA_NO_REGISTRADA"
    assert result["unassigned"][0]["name"] == "Pedido antiguo"


def test_optimizer_150_orders_and_15_vehicles_completes_within_45_seconds(client):
    for index in range(15):
        create_vehicle(client, plate=f"V{index:02d}-{index:03d}", capacity_kg=1000)
    stops = [
        {
            "id": index + 1,
            "name": f"Pedido {index + 1}",
            "lat": -12.05 + (index % 15) * 0.001,
            "lng": -77.04 + (index // 15) * 0.001,
            "demand_kg": 50,
        }
        for index in range(150)
    ]

    started = perf_counter()
    response = client.post("/api/routes/optimize", json={"stops": stops})
    elapsed = perf_counter() - started

    assert response.status_code == 200, response.text
    result = response.json()
    assert elapsed <= 45
    assert len(result["route_stops"]) == 150
    assert result["unassigned"] == []
    assert all(route["load_kg"] <= route["capacity_kg"] for route in result["routes"])


def test_vehicle_overrides_fuel_type_in_request(client):
    vehicle = create_vehicle(client, fuel_type="glp", emission_factor_co2=0.21)

    data = client.post(
        "/api/routes/optimize", json={"stops": STOPS, "vehicle_id": vehicle["id"], "fuel_type": "diesel"}
    ).json()

    assert data["fuel_type"] == "glp"
    assert data["emission_factor_kg_km"] == 0.21


def test_optimizer_reports_unassigned_orders_when_no_vehicle_is_available(client):
    data = client.post("/api/routes/optimize", json={"stops": STOPS}).json()

    assert data["vehicle"] is None
    assert data["routes"] == []
    assert data["route_stops"] == []
    assert len(data["unassigned"]) == len(STOPS)
    assert {item["reason"] for item in data["unassigned"]} == {"SIN_VEHICULOS_DISPONIBLES"}


@pytest.mark.parametrize(
    "status, label", [("EN_MANTENIMIENTO", "en mantenimiento"), ("DE_BAJA", "de baja")]
)
def test_unavailable_vehicle_is_excluded_from_routes(client, status, label):
    vehicle = create_vehicle(client)
    client.patch(f"/api/vehicles/{vehicle['id']}", json={"status": status})

    response = client.post("/api/routes/optimize", json={"stops": STOPS, "vehicle_id": vehicle["id"]})

    assert response.status_code == 409
    assert response.json()["detail"] == f"El vehículo ABC-123 está {label} y no puede asignarse a rutas."


def test_vehicle_back_to_active_can_be_used_again(client):
    vehicle = create_vehicle(client)
    client.patch(f"/api/vehicles/{vehicle['id']}", json={"status": "EN_MANTENIMIENTO"})
    client.patch(f"/api/vehicles/{vehicle['id']}", json={"status": "ACTIVO"})

    response = client.post("/api/routes/optimize", json={"stops": STOPS, "vehicle_id": vehicle["id"]})

    assert response.status_code == 200


def test_optimize_with_unknown_vehicle_returns_404(client):
    response = client.post("/api/routes/optimize", json={"stops": STOPS, "vehicle_id": 999})

    assert response.status_code == 404
