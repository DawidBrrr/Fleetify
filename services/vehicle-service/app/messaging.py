import json
from datetime import datetime, timezone

import pika

from .config import RABBITMQ_HOST, RABBITMQ_USER, RABBITMQ_PASS, VEHICLE_EVENT_QUEUE

def get_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
    return pika.BlockingConnection(parameters)

def publish_message(event_type, message=None):
    try:
        connection = get_connection()
        channel = connection.channel()
        channel.queue_declare(queue=VEHICLE_EVENT_QUEUE)

        payload = dict(message or {})
        payload.setdefault("event", event_type)
        payload.setdefault("emitted_at", datetime.now(timezone.utc).isoformat())

        channel.basic_publish(
            exchange="",
            routing_key=VEHICLE_EVENT_QUEUE,
            body=json.dumps(payload),
        )
        connection.close()
    except Exception as e:
        print(f"Failed to publish message: {e}")

async def consume_messages():
    # Placeholder for consuming messages if needed
    pass
