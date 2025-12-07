# Dashboard Service

This service aggregates data for the admin and employee dashboards.

## Tech Stack
- Python 3.11
- FastAPI
- RabbitMQ (Pika)

## API Endpoints
- `GET /dashboard/admin`: Get admin dashboard data
- `GET /dashboard/employee`: Get employee dashboard data
- `GET /dashboard/stats`: Get simple stats

## Events
Consumes `vehicle_events` from RabbitMQ to update internal state (mocked for now).
