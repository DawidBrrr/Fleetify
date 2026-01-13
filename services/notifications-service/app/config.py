import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@notifications-db:5432/notifications_db")
USER_MANAGEMENT_URL = os.getenv("USER_MANAGEMENT_URL", "http://user-management:8000")
SERVICE_TOKEN = os.getenv("NOTIFICATIONS_SERVICE_TOKEN", "")
USER_MANAGEMENT_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN", "")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS")
QUEUE_NAME = os.getenv("VEHICLE_EVENT_QUEUE", "vehicle_events")
