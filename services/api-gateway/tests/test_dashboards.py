"""Tests covering the dashboard proxy blueprint."""
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

    monkeypatch.setattr("app.routes.dashboards.proxy_json", _fake_proxy)
    return calls

def test_admin_dashboard_proxies_request(monkeypatch, client):
    """GET /api/dashboard/admin should proxy to analytics service with auth headers."""
    calls = _install_proxy_spy(monkeypatch)
    response = client.get(
        "/api/dashboard/admin?filter=active",
        headers={"Authorization": "Bearer admin-token"},
    )

    assert response.status_code == 202
    assert response.get_json()["path"] == "/dashboards/admin"
    assert calls[0]["service"] == "analytics"
    assert calls[0]["method"] == "GET"
    assert calls[0]["headers"] == {"Authorization": "Bearer admin-token"}
    assert dict(calls[0]["params"]) == {"filter": "active"}


def test_employee_dashboard_forwards_query_params(monkeypatch, client):
    """Employee endpoint must preserve query parameters for downstream filtering."""
    calls = _install_proxy_spy(monkeypatch)
    response = client.get(
        "/api/dashboard/employee?team=alpha&limit=5",
        headers={"Authorization": "Bearer employee"},
    )

    assert response.status_code == 202
    assert calls[0]["service"] == "analytics"
    assert calls[0]["path"] == "/dashboards/employee"
    assert dict(calls[0]["params"]) == {"team": "alpha", "limit": "5"}
    assert calls[0]["headers"] == {"Authorization": "Bearer employee"}


def test_vehicle_snapshot_handles_missing_auth(monkeypatch, client):
    """Vehicle snapshot should still proxy even when Authorization header is absent."""
    calls = _install_proxy_spy(monkeypatch)
    response = client.get("/api/dashboard/vehicles")

    assert response.status_code == 202
    assert calls[0]["path"] == "/dashboards/vehicles"
    assert calls[0]["headers"] == {}



