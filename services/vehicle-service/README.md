# Vehicle Service

This service manages the fleet of vehicles.

## Tech Stack
- Python 3.11
- FastAPI
- SQLAlchemy
- PostgreSQL
- RabbitMQ (Pika)

## API Endpoints
- `GET /vehicles/`: List all vehicles
- `POST /vehicles/`: Create a new vehicle
- `GET /vehicles/{id}`: Get vehicle details

## Events
Publishes `vehicle_created` event to RabbitMQ.
