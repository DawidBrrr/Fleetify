"""Configuration module for the gateway."""
from __future__ import annotations

import os
from dataclasses import dataclass


def env(key: str, default: str | None = None) -> str:
    value = os.getenv(key, default)
    if value is None:
        raise RuntimeError(f"Missing required environment variable: {key}")
    return value


@dataclass(slots=True)
class BaseConfig:
    SECRET_KEY: str = env("SECRET_KEY", "dev-secret")
    JSON_SORT_KEYS: bool = False
    PROPAGATE_EXCEPTIONS: bool = True
    RATELIMIT_DEFAULT: str = env("RATE_LIMIT_DEFAULT", "60 per minute")
    RATELIMIT_HEADERS_ENABLED: bool = True
    ALLOWED_ORIGINS: list[str] = os.getenv("ALLOWED_ORIGINS", "*").split(",")
    AUTH_SERVICE_URL: str = env("AUTH_SERVICE_URL", "http://localhost:8000")
    ANALYTICS_SERVICE_URL: str = env("ANALYTICS_SERVICE_URL", "http://localhost:9000")
    NOTIFICATIONS_SERVICE_URL: str = env("NOTIFICATIONS_SERVICE_URL", "http://localhost:9100")
    INTERNAL_HMAC_SECRET: str = env("INTERNAL_HMAC_SECRET", "demo-hmac")


@dataclass(slots=True)
class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True


@dataclass(slots=True)
class ProductionConfig(BaseConfig):
    DEBUG: bool = False


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}


def get_config(config_name: str | None) -> type[BaseConfig]:
    env_name = config_name or os.getenv("FLASK_ENV", "development").lower()
    return CONFIG_MAP.get(env_name, DevelopmentConfig)
