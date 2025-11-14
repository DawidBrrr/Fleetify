"""Authentication entrypoints."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..extensions import limiter
from ..security import sign_token

auth_bp = Blueprint("auth", __name__)

DUMMY_USERS = {
    "admin": {
        "password": "admin",
        "role": "admin",
        "name": "Alicja Fleet",
        "email": "admin@fleetify.io",
    },
    "user": {
        "password": "user",
        "role": "employee",
        "name": "Piotr Kierowca",
        "email": "piotr.kierowca@fleetify.io",
    },
}


@auth_bp.post("/login")
@limiter.limit("10 per minute")
def login():
    payload = request.json or {}
    username = payload.get("username", "").lower()
    password = payload.get("password", "")

    user = DUMMY_USERS.get(username)
    if not user or user["password"] != password:
        return jsonify({"message": "Nieprawidłowe dane logowania"}), 401

    token = sign_token({"role": user["role"], "email": user["email"], "name": user["name"]})
    return jsonify({"token": token, "user": {k: v for k, v in user.items() if k != "password"}})
