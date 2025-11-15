"""Global error handlers for the gateway."""
from __future__ import annotations

from flask import Blueprint, jsonify

errors_bp = Blueprint("errors", __name__)


@errors_bp.app_errorhandler(429)
def handle_rate_limit(exc):  # pragma: no cover - flask internals
    """Return a JSON error payload when Flask-Limiter blocks a client."""
    return jsonify({"message": "Rate limit exceeded", "details": str(exc)}), 429


@errors_bp.app_errorhandler(PermissionError)
def handle_permission(exc):
    """Translate permission exceptions into HTTP 403 responses."""
    return jsonify({"message": str(exc) or "Access denied"}), 403


@errors_bp.app_errorhandler(Exception)
def handle_generic(exc):  # pragma: no cover
    """Catch-all handler that hides internal traces behind a generic message."""
    return jsonify({"message": "Internal gateway error", "details": str(exc)}), 500
