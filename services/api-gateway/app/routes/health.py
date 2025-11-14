"""Health probes for orchestrators."""
from __future__ import annotations

from flask import Blueprint, jsonify

from ..extensions import limiter

health_bp = Blueprint("health", __name__)


@health_bp.get("/healthz")
@limiter.exempt
def liveness():
    return jsonify({"status": "ok"})


@health_bp.get("/readyz")
@limiter.exempt
def readiness():
    return jsonify({"status": "ready"})
