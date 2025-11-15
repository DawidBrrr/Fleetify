"""Global error handlers for the gateway."""
from __future__ import annotations

from flask import Blueprint, jsonify

errors_bp = Blueprint("errors", __name__)


@errors_bp.app_errorhandler(429)
def handle_rate_limit(exc):  # pragma: no cover - flask internals
    return jsonify({"message": "Rate limit exceeded", "details": str(exc)}), 429


@errors_bp.app_errorhandler(PermissionError)
def handle_permission(exc):
    return jsonify({"message": str(exc) or "Access denied"}), 403


@errors_bp.app_errorhandler(Exception)
def handle_generic(exc):  # pragma: no cover
    return jsonify({"message": "Internal gateway error", "details": str(exc)}), 500
