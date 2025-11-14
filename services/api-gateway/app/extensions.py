"""Flask extensions shared across modules."""
from __future__ import annotations

import uuid
from loguru import logger
from flask import g, request
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


class RequestID:
    """Attach a correlation/request ID to each incoming request."""

    def init_app(self, app):  # type: ignore[override]
        @app.before_request
        def assign_request_id():  # pragma: no cover - trivial
            g.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

        @app.after_request
        def add_request_id(response):  # pragma: no cover - trivial
            response.headers["X-Request-ID"] = getattr(g, "request_id", "unknown")
            return response


cors = CORS()
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
request_id = RequestID()

__all__ = ["cors", "limiter", "logger", "request_id"]
