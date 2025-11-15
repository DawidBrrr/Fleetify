"""Configuration module for the gateway."""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def env(key: str, default: str | None = None) -> str:
    """Read an environment variable or raise when a required key is missing."""
    value = os.getenv(key, default)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


def _allowed_origins_factory() -> list[str]:
    """Build a fresh list of allowed origins for every config instance."""
    return os.getenv("ALLOWED_ORIGINS", "*").split(",")


def _service_endpoints_factory() -> dict[str, str]:
    """Collect downstream service base URLs with sensible local defaults."""
    return {
        "auth": env("AUTH_SERVICE_URL", "http://localhost:8000"),
        "analytics": env("ANALYTICS_SERVICE_URL", "http://localhost:9000"),
        "notifications": env("NOTIFICATIONS_SERVICE_URL", "http://localhost:9100"),
    }


@dataclass(slots=True)
class BaseConfig:
    """Baseline gateway configuration shared by every environment."""
    SECRET_KEY: str = env("SECRET_KEY", "dev-secret")
    JSON_SORT_KEYS: bool = False
    PROPAGATE_EXCEPTIONS: bool = True
    RATELIMIT_DEFAULT: str = env("RATE_LIMIT_DEFAULT", "60 per minute")
    RATELIMIT_HEADERS_ENABLED: bool = True
    ALLOWED_ORIGINS: list[str] = field(default_factory=_allowed_origins_factory)
    INTERNAL_HMAC_SECRET: str = env("INTERNAL_HMAC_SECRET", "demo-hmac")
    SERVICE_TIMEOUT: float = float(os.getenv("SERVICE_TIMEOUT", "5.0"))
    SERVICE_ENDPOINTS: dict[str, str] = field(default_factory=_service_endpoints_factory)



@dataclass(slots=True)
class DevelopmentConfig(BaseConfig):
    """Verbose/debug-friendly settings for local development."""
    DEBUG: bool = True


@dataclass(slots=True)
class ProductionConfig(BaseConfig):
    """Hardened settings for production deployments."""
    DEBUG: bool = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config(config_name: str | None) -> type[BaseConfig]:
    """Return the config class matching the supplied or FLASK_ENV value."""
    env_name = config_name or os.getenv("FLASK_ENV", "development").lower()
    return CONFIG_MAP.get(env_name, DevelopmentConfig)
