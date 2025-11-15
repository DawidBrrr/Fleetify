"""Utility helpers for HTTP responses."""
from __future__ import annotations

from flask import Response, current_app, jsonify

from ..proxy import GatewayUpstreamError, forward_request


def proxy_json(service: str, *, method: str, path: str, body=None, headers=None, params=None) -> Response:
    """Forward a request via the proxy helper and convert payloads into Flask responses."""
    try:
        payload, status, upstream_headers = forward_request(
            service, method=method, path=path, body=body, headers=headers, params=params
        )
    except GatewayUpstreamError as exc:
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
    return response
