def test_api_responses_include_security_headers(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["Permissions-Policy"] == "camera=(), microphone=(), geolocation=()"


def test_authentication_responses_are_not_cached(client):
    response = client.post("/api/auth/login", json={"email": "admin@distrirapido.pe", "password": "incorrecta"})

    assert response.headers["Cache-Control"] == "no-store"
    assert response.headers["Pragma"] == "no-cache"


def test_cors_preflight_allows_configured_frontend_origin(client):
    response = client.options(
        "/api/customers",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["Access-Control-Allow-Origin"] == "http://localhost:5173"
    assert response.headers.get("Access-Control-Allow-Credentials") is None
    assert "authorization" in response.headers["Access-Control-Allow-Headers"].lower()


def test_cors_preflight_rejects_unconfigured_origin(client):
    response = client.options(
        "/api/customers",
        headers={
            "Origin": "https://attacker.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 400
    assert "Access-Control-Allow-Origin" not in response.headers
