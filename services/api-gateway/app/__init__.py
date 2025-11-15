"""Application factory for the Fleetify API Gateway."""

from flask import Flask
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
    return app
