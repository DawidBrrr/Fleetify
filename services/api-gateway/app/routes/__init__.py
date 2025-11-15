"""Route registration for the gateway."""
from flask import Flask

from .auth import auth_bp
from .dashboards import dashboards_bp
from .errors import errors_bp
from .health import health_bp
from .notifications import notifications_bp


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(errors_bp)
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(dashboards_bp, url_prefix="/api")
    app.register_blueprint(notifications_bp, url_prefix="/api")
