"""Static mock payloads for running the gateway without downstream services."""
from __future__ import annotations

from typing import Any, Dict, Tuple

MockKey = Tuple[str, str, str]
MockValue = Tuple[Any, int]

MOCK_PAYLOADS: Dict[MockKey, MockValue] = {
    # Analytics dashboards
    ("analytics", "GET", "/dashboards/admin"): (
        {
            "stats": [
                {"label": "Aktywne pojazdy", "value": 128, "delta": "+4", "tone": "success"},
                {"label": "Średnie zużycie paliwa", "value": "6.8 l/100km", "delta": "-0.3", "tone": "success"},
                {"label": "Alerty krytyczne", "value": 5, "delta": "-2", "tone": "warning"},
                {"label": "Dostępność floty", "value": "92%", "delta": "+3%", "tone": "info"},
            ],
            "fleetHealth": [
                {"id": "WX-432", "model": "Skoda Enyaq", "status": "OK", "location": "Warszawa HQ", "battery": 82},
                {"id": "GD-218", "model": "Tesla Model 3", "status": "Serwis", "location": "Gdańsk", "battery": 54},
                {"id": "KR-019", "model": "VW Crafter", "status": "OK", "location": "Kraków", "battery": 0},
            ],
            "alerts": [
                {"id": "ALT-311", "type": "Serwis", "severity": "warning", "message": "Przegląd VW Crafter opóźniony o 5 dni."},
                {"id": "ALT-312", "type": "Telemetria", "severity": "info", "message": "Spadek jakości sygnału dla 6 urządzeń IoT."},
                {"id": "ALT-313", "type": "Bezpieczeństwo", "severity": "danger", "message": "Niespodziewany postój pojazdu KR-019."},
            ],
            "costBreakdown": {"fuel": 42, "service": 25, "insurance": 11, "leasing": 22},
        },
        200,
    ),
    ("analytics", "GET", "/dashboards/employee"): (
        {
            "assignment": {
                "vehicle": {
                    "id": "WL-2043",
                    "model": "Hyundai IONIQ 5",
                    "vin": "KMHAA81CRNU123456",
                    "mileage": "18 430 km",
                    "battery": 74,
                    "tirePressure": "OK",
                },
                "tasks": [
                    {"id": "TASK-01", "label": "Odbiór klienta – lotnisko"},
                    {"id": "TASK-02", "label": "Wizyta w serwisie partnerskim"},
                ],
            },
            "trips": [
                {"id": 1, "route": "Warszawa ↔ Łódź", "distance": "264 km", "cost": "78 PLN", "efficiency": "6.1 l/100km"},
                {"id": 2, "route": "Warszawa ↔ Poznań", "distance": "580 km", "cost": "122 PLN", "efficiency": "6.9 l/100km"},
            ],
            "reminders": [
                {"id": "REM-1", "message": "Kontrola opon za 12 dni", "severity": "info"},
                {"id": "REM-2", "message": "Raport wydatków za 3 dni", "severity": "warning"},
            ],
        },
        200,
    ),
    ("analytics", "GET", "/dashboards/vehicles"): (
        {
            "fleet": {
                "total": 76,
                "available": 58,
                "maintenance": 9,
                "offline": 9,
            },
            "locations": [
                {"city": "Warsaw", "active": 18},
                {"city": "Krakow", "active": 11},
                {"city": "Gdansk", "active": 7},
            ],
        },
        200,
    ),
    # Auth service mocks
    ("auth", "POST", "/auth/login"): (
        {
            "token": "mock-admin-token",
            "user": {
                "role": "admin",
                "name": "Alicja Fleet",
                "email": "admin@fleetify.io",
                "avatar": "https://i.pravatar.cc/120?img=47",
            },
        },
        200,
    ),
    ("auth", "POST", "/auth/refresh"): (
        {"access_token": "refreshed-access-token", "refresh_token": "refreshed-refresh-token"},
        202,
    ),
    ("auth", "POST", "/auth/logout"): (
        {"message": "User logged out (mock)"},
        202,
    ),
    # Notifications service mocks
    ("notifications", "POST", "/notifications/send"): (
        {"message": "Notification enqueued (mock)", "notification_id": "mock-123"},
        202,
    ),
    ("notifications", "GET", "/notifications/history"): (
        {
            "history": [
                {"id": "mock-100", "channel": "email", "status": "delivered"},
                {"id": "mock-101", "channel": "sms", "status": "queued"},
            ]
        },
        200,
    ),
}
"""Mapping from (service, method, path) to (payload, status)."""
