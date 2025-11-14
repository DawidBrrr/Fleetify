"""Dashboard demo endpoints with rate limiting and token check."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..extensions import limiter
from ..security import verify_token


dashboards_bp = Blueprint("dashboards", __name__)

ADMIN_DASHBOARD = {
    "stats": [
        {"label": "Aktywne pojazdy", "value": 128, "delta": "+4", "tone": "success"},
        {"label": "Alerty krytyczne", "value": 5, "delta": "-2", "tone": "warning"},
    ]
}

EMPLOYEE_DASHBOARD = {
    "assignment": {
        "vehicle": {"id": "WL-2043", "model": "Hyundai IONIQ 5"}
    }
}


def _require_auth():
    token = request.headers.get("Authorization", "").removeprefix("Bearer ").strip()
    if not token:
        raise PermissionError("MISSING_TOKEN")
    return verify_token(token)


def _safe_response(payload):
    return jsonify(payload)


@dashboards_bp.get("/dashboard/admin")
@limiter.limit("30 per minute")
def admin_dashboard():
    claims = _require_auth()
    if claims["role"] != "admin":
        return jsonify({"message": "Brak dostępu"}), 403
    return _safe_response(ADMIN_DASHBOARD)


@dashboards_bp.get("/dashboard/employee")
@limiter.limit("30 per minute")
def employee_dashboard():
    claims = _require_auth()
    if claims["role"] not in {"employee", "admin"}:
        return jsonify({"message": "Brak dostępu"}), 403
    return _safe_response(EMPLOYEE_DASHBOARD)
