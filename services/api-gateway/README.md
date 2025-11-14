# Fleetify API Gateway

Flask-based edge service that terminates requests from the React frontend and proxies them to backend microservices (auth, analytics, notifications). It centralizes security, rate limiting, and observability concerns.

## Features

- Token validation and signing using `itsdangerous` secrets.
- Role-aware routing stubs for admin/employee dashboards.
- Global and per-endpoint rate limiting via `flask-limiter`.
- HTTPS enforcement + simple HMAC signature helper for outgoing service calls.
- Structured logging and request IDs.

## Project layout

```
api-gateway/
├── app/
│   ├── __init__.py        # Flask app factory
│   ├── config.py          # Environment config objects
│   ├── extensions.py      # Limiter, CORS, logging helpers
│   ├── security.py        # Token helpers, signature utilities
│   ├── proxy.py           # Helper for calling downstream services
│   └── routes/
│       ├── __init__.py
│       ├── auth.py        # /api/login
│       ├── dashboards.py  # /api/dashboard/*
│       └── health.py      # readiness/liveness probes
├── tests/
│   └── test_health.py
├── Dockerfile
├── requirements.txt
├── .env.example
└── wsgi.py
```

## Quick start

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt
export FLASK_APP=app
flask run --reload
```

Or build and run via Docker:

```bash
cd services/api-gateway
docker build -t fleetify-gateway .
docker run -p 8080:8080 --env-file .env.example fleetify-gateway
```

The service currently exposes demo data; replace `proxy.py` integrations and secrets before production.
