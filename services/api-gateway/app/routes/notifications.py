"""Gateway endpoints for notifications service."""
from __future__ import annotations

from flask import Blueprint, request

from ..extensions import limiter
from ..security import require_api_key, require_signed_payload
from .utils import proxy_json

notifications_bp = Blueprint("notifications", __name__)


def _auth_headers():
    """Propagate Authorization header so notifications service enforces ACLs."""
    token = request.headers.get("Authorization")
    return {"Authorization": token} if token else {}


@notifications_bp.post("/notifications/send")
@require_api_key
@require_signed_payload
@limiter.limit("15 per minute")
def send_notification():
    """Relay notification payloads to the downstream service."""
    return proxy_json(
        "notifications",
        method="POST",
        path="/notifications/send",
        body=request.json,
        headers=_auth_headers(),
    )


@notifications_bp.get("/notifications/history")
@require_api_key
@limiter.limit("30 per minute")
def notification_history():
    """Fetch notification history for the current user/team."""
    return proxy_json(
        "notifications",
        method="GET",
        path="/notifications/history",
        headers=_auth_headers(),
        params=request.args,
    )
