"""Authentication endpoints proxying to the auth microservice."""
from __future__ import annotations

from flask import Blueprint, request

from ..extensions import limiter
from .utils import proxy_json

auth_bp = Blueprint("auth", __name__)


def _body() -> dict | None:
    """Return JSON payload or None without raising on invalid JSON."""
    return request.get_json(silent=True) or None


def _auth_headers() -> dict[str, str]:
    """Forward Authorization header to downstream auth service when present."""
    token = request.headers.get("Authorization")
    return {"Authorization": token} if token else {}


@auth_bp.post("/login")
@limiter.limit("20 per minute")
def login():
    """Authenticate user credentials via auth service."""
    return proxy_json("auth", method="POST", path="/auth/login", body=_body())


@auth_bp.post("/refresh")
@limiter.limit("40 per minute")
def refresh_token():
    """Refresh JWT/Session tokens."""
    return proxy_json("auth", method="POST", path="/auth/refresh", body=_body(), headers=_auth_headers())


@auth_bp.post("/logout")
@limiter.limit("40 per minute")
def logout():
    """Invalidate tokens upstream."""
    return proxy_json("auth", method="POST", path="/auth/logout", body=_body(), headers=_auth_headers())
