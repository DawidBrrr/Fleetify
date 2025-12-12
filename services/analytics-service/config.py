import os
from pathlib import Path

from dotenv import load_dotenv

SERVICE_ROOT = Path(__file__).resolve().parent
ENV_PATH = SERVICE_ROOT / ".env"
load_dotenv(ENV_PATH)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@analytics-db:5432/analytics")
USER_MANAGEMENT_URL = os.getenv("USER_MANAGEMENT_URL", "http://user-management:8000")
