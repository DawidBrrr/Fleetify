"""Tests covering the auth proxy blueprint."""
from __future__ import annotations

import sys
from pathlib import Path

import pytest
from flask import jsonify

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app import create_app


@pytest.fixture()
def client():
    """Return a Flask test client bound to the development config."""
    app = create_app("development")
    app.config.update(TESTING=True)
    with app.test_client() as test_client:
        yield test_client


def _install_proxy_spy(monkeypatch):
    """Replace proxy_json with a spy to assert call parameters."""
    calls: list[dict] = []

    def _fake_proxy(service, *, method, path, body=None, headers=None, params=None):
        calls.append(
            {
                "service": service,
                "method": method,
                "path": path,
                "body": body,
                "headers": headers,
                "params": params,
            }
        )
        response = jsonify({"service": service, "path": path})
        response.status_code = 202
        return response

    monkeypatch.setattr("app.routes.auth.proxy_json", _fake_proxy)
    return calls


def test_login_proxies_payload(monkeypatch, client):
    """POST /api/login should forward payload to auth service unmodified."""
    calls = _install_proxy_spy(monkeypatch)
    payload = {"email": "demo@example.com", "password": "secret"}

    response = client.post("/api/login", json=payload)

    assert response.status_code == 202
    assert response.get_json()["path"] == "/auth/login"
    assert calls[0]["service"] == "auth"
    assert calls[0]["method"] == "POST"
    assert calls[0]["body"] == payload
    assert calls[0]["headers"] is None


def test_login_handles_missing_body(monkeypatch, client):
    """Missing JSON bodies should become None instead of crashing the proxy."""
    calls = _install_proxy_spy(monkeypatch)

    response = client.post("/api/login")

    assert response.status_code == 202
    assert calls[0]["body"] is None


def test_refresh_includes_auth_header(monkeypatch, client):
    """Refresh endpoint must propagate Authorization header to downstream auth."""
    calls = _install_proxy_spy(monkeypatch)
    token = "Bearer abc123"

    response = client.post("/api/refresh", json={"refresh": "token"}, headers={"Authorization": token})

    assert response.status_code == 202
    assert calls[0]["headers"] == {"Authorization": token}
    assert calls[0]["path"] == "/auth/refresh"


def test_logout_forwards_auth_header(monkeypatch, client):
    """Logout endpoint should forward Authorization headers."""
    calls = _install_proxy_spy(monkeypatch)
    token = "Bearer bye"

    response = client.post("/api/logout", headers={"Authorization": token})

    assert response.status_code == 202
    assert calls[0]["headers"] == {"Authorization": token}
    assert calls[0]["path"] == "/auth/logout"