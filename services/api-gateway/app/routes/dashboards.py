"""Dashboard aggregation endpoints."""
from __future__ import annotations

from flask import Blueprint, request

from ..extensions import limiter
from .utils import proxy_json

dashboards_bp = Blueprint("dashboards", __name__)


def _auth_headers() -> dict[str, str]:
    token = request.headers.get("Authorization")
    return {"Authorization": token} if token else {}


@dashboards_bp.get("/dashboard/admin")
@limiter.limit("60 per minute")
def admin_dashboard():
    return proxy_json(
        "analytics",
        method="GET",
        path="/dashboards/admin",
        headers=_auth_headers(),
        params=request.args,
    )


@dashboards_bp.get("/dashboard/employee")
@limiter.limit("60 per minute")
def employee_dashboard():
    return proxy_json(
        "analytics",
        method="GET",
        path="/dashboards/employee",
        headers=_auth_headers(),
        params=request.args,
    )


@dashboards_bp.get("/dashboard/vehicles")
@limiter.limit("90 per minute")
def vehicles_snapshot():
    return proxy_json(
        "analytics",
        method="GET",
        path="/dashboards/vehicles",
        headers=_auth_headers(),
        params=request.args,
    )
