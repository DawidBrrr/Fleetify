"""HTTP client helpers for calling downstream services."""
from __future__ import annotations

import json
from typing import Any, Mapping

import httpx
from flask import current_app, g
from loguru import logger

from .security import sign_payload


def _get_base_url(service_key: str) -> str:
    try:
        base_url = current_app.config["SERVICE_ENDPOINTS"][service_key]
    except KeyError as exc:  # pragma: no cover - config issue
        raise RuntimeError(f"Unknown service '{service_key}'") from exc
    return base_url.rstrip("/")


def _build_headers(body: dict[str, Any] | None, extra: Mapping[str, str] | None = None) -> dict[str, str]:
    payload = json.dumps(body or {}, sort_keys=True)
    headers = {
        "X-Gateway-Signature": sign_payload(payload),
        "X-Request-ID": getattr(g, "request_id", "gateway"),
        "Content-Type": "application/json",
    }
    if extra:
        headers.update(extra)
    return headers


def forward_request(
    service: str,
    *,
    method: str,
    path: str,
    body: dict[str, Any] | None = None,
    headers: Mapping[str, str] | None = None,
    params: Mapping[str, Any] | None = None,
) -> tuple[Any, int, Mapping[str, str]]:
    url = f"{_get_base_url(service)}/{path.lstrip('/')}"
    timeout = current_app.config["SERVICE_TIMEOUT"]
    request_headers = _build_headers(body, headers)
    logger.debug("Forwarding {method} {url}", method=method.upper(), url=url)
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.request(method.upper(), url, json=body, params=params, headers=request_headers)
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.warning("Downstream error %s %s -> %s", method.upper(), url, exc.response.status_code)
        raise GatewayUpstreamError(exc.response.json(), exc.response.status_code) from exc
    except httpx.HTTPError as exc:
        logger.error("Downstream unavailable %s %s: %s", method.upper(), url, exc)
        raise GatewayUpstreamError({"message": "Upstream service unavailable"}, 502) from exc
    content_type = response.headers.get("content-type", "application/json")
    parsed = response.json() if "json" in content_type else response.text
    return parsed, response.status_code, {"Content-Type": content_type}


class GatewayUpstreamError(RuntimeError):
    """Raised when downstream services fail."""

    def __init__(self, payload: Any, status_code: int) -> None:
        super().__init__(str(payload))
        self.payload = payload
        self.status_code = status_code
