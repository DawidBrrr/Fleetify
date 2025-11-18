"""Tests covering the notifications proxy blueprint."""
from __future__ import annotations

import hashlib
import hmac
import json
import sys
from pathlib import Path

import pytest
from flask import jsonify

API_KEY_HEADER = "X-API-Key"
SIGNATURE_HEADER = "X-Client-Signature"
VALID_API_KEY = "suite-api-key"

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app import create_app


@pytest.fixture()
def client():
    """Return a Flask test client bound to the development config."""
    app = create_app("development")
    app.config.update(TESTING=True, GATEWAY_API_KEYS=[VALID_API_KEY], INTERNAL_HMAC_SECRET="tests-only-secret")
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

    monkeypatch.setattr("app.routes.notifications.proxy_json", _fake_proxy)
    return calls


def _signed_headers(app, raw_payload: str, extra: dict | None = None) -> dict:
    """Return headers containing API key and payload signature."""
    secret = app.config["INTERNAL_HMAC_SECRET"].encode()
    signature = hmac.new(secret, raw_payload.encode(), hashlib.sha256).hexdigest()
    headers = {
        API_KEY_HEADER: VALID_API_KEY,
        SIGNATURE_HEADER: signature,
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def test_send_notification_proxies_with_valid_signature(monkeypatch, client):
    calls = _install_proxy_spy(monkeypatch)
    payload = {"channel": "email", "message": "Hello"}
    raw_payload = json.dumps(payload)

    response = client.post(
        "/api/notifications/send",
        data=raw_payload,
        headers=_signed_headers(client.application, raw_payload, {"Authorization": "Bearer user"}),
    )

    assert response.status_code == 202
    assert calls[0]["service"] == "notifications"
    assert calls[0]["body"] == payload
    assert calls[0]["headers"]["Authorization"] == "Bearer user"


def test_send_notification_rejects_missing_signature(client):
    payload = json.dumps({"channel": "sms", "message": "Ping"})
    headers = {API_KEY_HEADER: VALID_API_KEY, "Content-Type": "application/json"}

    response = client.post("/api/notifications/send", data=payload, headers=headers)

    assert response.status_code == 403


def test_send_notification_rejects_invalid_signature(client):
    payload = json.dumps({"channel": "push", "message": "Alert"})
    headers = {
        API_KEY_HEADER: VALID_API_KEY,
        SIGNATURE_HEADER: "invalid",
        "Content-Type": "application/json",
    }

    response = client.post("/api/notifications/send", data=payload, headers=headers)

    assert response.status_code == 403
