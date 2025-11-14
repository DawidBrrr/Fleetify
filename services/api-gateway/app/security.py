"""Security helpers: token signing, HMAC signatures."""
from __future__ import annotations

import hashlib
import hmac
import time
from dataclasses import dataclass
from typing import Any

from flask import current_app
from itsdangerous import BadSignature, URLSafeTimedSerializer


@dataclass(slots=True)
class TokenPayload:
    role: str
    email: str
    name: str


def _serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(secret_key=current_app.config["SECRET_KEY"], salt="fleetify-gateway")


def sign_token(payload: dict[str, Any], expires_in: int = 3600) -> str:
    timestamp = int(time.time()) + expires_in
    data = {**payload, "exp": timestamp}
    return _serializer().dumps(data)


def verify_token(token: str) -> dict[str, Any]:
    try:
        data = _serializer().loads(token, max_age=7200)
    except BadSignature as exc:  # pragma: no cover - simple mapping
        raise PermissionError("INVALID_TOKEN") from exc
    if data.get("exp", 0) < int(time.time()):
        raise PermissionError("TOKEN_EXPIRED")
    return data


def sign_payload(payload: str) -> str:
    secret = current_app.config["INTERNAL_HMAC_SECRET"].encode()
    return hmac.new(secret, payload.encode(), hashlib.sha256).hexdigest()


def is_signature_valid(payload: str, signature: str) -> bool:
    expected = sign_payload(payload)
    return hmac.compare_digest(expected, signature)
