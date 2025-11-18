"""Application factory for the Fleetify API Gateway."""

from time import time

from flask import Flask, g, request

from .config import get_config
from .extensions import cors, limiter, logger, request_id
from .routes import register_blueprints


def create_app(config_name: str | None = None) -> Flask:
    """Create and configure the Flask gateway application."""
    app = Flask(__name__)
    config_cls = get_config(config_name)
    app.config.from_object(config_cls())

    request_id.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["ALLOWED_ORIGINS"]}})
    limiter.init_app(app)
    limiter.default_limits = [app.config["RATELIMIT_DEFAULT"]]
    logger.configure(extra={"service": "fleetify-gateway"})

    register_blueprints(app)

    def _log_context():
        return logger.bind(request_id=getattr(g, "request_id", "unknown"))

    @app.before_request
    def _log_request():  # pragma: no cover - glue code
        g._gateway_started_at = time()
        _log_context().info("Incoming {method} {path}", method=request.method, path=request.full_path.rstrip("?") or "/")

    @app.after_request
    def _log_response(response):  # pragma: no cover - glue code
        started = getattr(g, "_gateway_started_at", None)
        duration_ms = (time() - started) * 1000 if started else 0
        _log_context().info(
            "Completed {method} {path} -> {status} in {duration:.2f}ms",
            method=request.method,
            path=request.full_path.rstrip("?") or "/",
            status=response.status_code,
            duration=duration_ms,
        )
        return response

    return app
