"""Static mock payloads for running the gateway without downstream services."""
from __future__ import annotations

from typing import Any, Dict, Tuple

MockKey = Tuple[str, str, str]
MockValue = Tuple[Any, int]

MOCK_PAYLOADS: Dict[MockKey, MockValue] = {
    # Analytics dashboards
    ("analytics", "GET", "/dashboards/admin"): (
        {
            "summary": {"activeUsers": 1280, "fleetUtilization": 0.82, "alertsOpen": 12},
            "trend": [64, 72, 70, 85, 91, 88, 94],
        },
        200,
    ),
    ("analytics", "GET", "/dashboards/employee"): (
        {
            "tasks": [
                {"id": "TK-100", "status": "open", "priority": "high"},
                {"id": "TK-101", "status": "in_progress", "priority": "medium"},
            ],
            "performanceScore": 92,
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
            "access_token": "mock-access-token",
            "refresh_token": "mock-refresh-token",
            "user": {"id": "demo-user", "email": "demo@example.com", "role": "admin"},
        },
        202,
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
