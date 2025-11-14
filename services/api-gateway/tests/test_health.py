from app import create_app


def test_health_endpoints():
    app = create_app("development")
    client = app.test_client()

    assert client.get("/healthz").status_code == 200
    assert client.get("/readyz").json["status"] == "ready"
