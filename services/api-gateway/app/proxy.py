"""HTTP client helpers for calling downstream services."""
from __future__ import annotations

import json
from typing import Any

import httpx
from flask import current_app

from .security import sign_payload


async def call_service(method: str, url: str, *, json_body: dict[str, Any] | None = None) -> httpx.Response:
    payload_str = json.dumps(json_body or {})
    headers = {"X-Gateway-Signature": sign_payload(payload_str)}
    timeout = httpx.Timeout(5.0, read=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.request(method, url, json=json_body, headers=headers)
        response.raise_for_status()
        return response
