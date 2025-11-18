"""Utility helpers for HTTP responses."""
from __future__ import annotations

from flask import Response, current_app, jsonify

from ..extensions import logger
from ..mock_data import MOCK_PAYLOADS
from ..proxy import GatewayUpstreamError, forward_request

"""TO BE REMOVED ONLY FOR TESTING PURPOSES"""
def _mock_response(service: str, method: str, path: str):
    """Return a mock payload when mock mode is enabled and the key exists."""
    if not current_app.config.get("ENABLE_DOWNSTREAM_MOCKS"):
        return None

    key = (service, method.upper(), f"/{path.lstrip('/')}")
    return MOCK_PAYLOADS.get(key)


def proxy_json(service: str, *, method: str, path: str, body=None, headers=None, params=None) -> Response:
    """Forward a request via the proxy helper and convert payloads into Flask responses."""

    """TO BE REMOVED ONLY FOR TESTING PURPOSES"""
    mock_payload = _mock_response(service, method, path)
    if mock_payload:
        logger.debug(
            "Serving mock payload for {service} {method} {path}",
            service=service,
            method=method.upper(),
            path=path,
        )
        payload, status = mock_payload
        response = jsonify(payload) if isinstance(payload, (dict, list)) else current_app.response_class(payload)
        response.status_code = status
        return response

    try:
        payload, status, upstream_headers = forward_request(
            service, method=method, path=path, body=body, headers=headers, params=params
        )
    except GatewayUpstreamError as exc:
        logger.error(
            "Downstream failure for {service} {method} {path}: {status}",
            service=service,
            method=method.upper(),
            path=path,
            status=exc.status_code,
        )
        response = jsonify(exc.payload if isinstance(exc.payload, dict) else {"message": str(exc)})
        response.status_code = exc.status_code
        return response

    if isinstance(payload, (dict, list)):
        response = jsonify(payload)
    else:
        response = current_app.response_class(payload)
    response.status_code = status
    for key, value in upstream_headers.items():
        response.headers[key] = value
    logger.debug(
        "Proxied {service} {method} {path} -> {status}",
        service=service,
        method=method.upper(),
        path=path,
        status=status,
    )
    return response
