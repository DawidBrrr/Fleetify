import json
import threading
import time

import pika

from .config import QUEUE_NAME, RABBITMQ_HOST, RABBITMQ_PASS, RABBITMQ_USER
from .database import SessionLocal
from .routes import create_vehicle_alert

ALERT_STATUSES = {"maintenance", "issue", "alert"}

def should_raise_alert(payload: dict) -> bool:
    updates = payload.get("updates", {}) or {}
    if isinstance(updates, dict):
        status = updates.get("status")
        if status in ALERT_STATUSES:
            return True
        if updates.get("issues"):
            return True
    if payload.get("severity") in {"high", "critical"}:
        return True
    return False

def process_message(body: bytes):
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return

    if not should_raise_alert(payload):
        return

    db = SessionLocal()
    try:
        payload.setdefault("message", "Wykryto problem z pojazdem")
        import asyncio
        asyncio.run(create_vehicle_alert(payload, db))
    finally:
        db.close()

def start_consumer():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials, heartbeat=0)

    def _run():
        while True:
            try:
                connection = pika.BlockingConnection(parameters)
                channel = connection.channel()
                channel.queue_declare(queue=QUEUE_NAME, durable=False)

                for method_frame, _, body in channel.consume(QUEUE_NAME, inactivity_timeout=5):
                    if body:
                        process_message(body)
                    if method_frame is None:
                        connection.sleep(1)
            except Exception:
                time.sleep(5)

    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
