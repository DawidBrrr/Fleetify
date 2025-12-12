import os
from pathlib import Path
from dotenv import load_dotenv

# Resolve the service root so loading works no matter the CWD
SERVICE_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = SERVICE_ROOT / ".env"

# load_dotenv silently ignores missing files, so local overrides remain optional
load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@vehicle-db:5432/vehicle_db")
RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")
