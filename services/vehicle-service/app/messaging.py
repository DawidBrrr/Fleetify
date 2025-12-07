import pika
import json
import os
import time

RABBITMQ_HOST = os.getenv("RABBITMQ_HOST", "rabbitmq")
RABBITMQ_USER = os.getenv("RABBITMQ_USER", "guest")
RABBITMQ_PASS = os.getenv("RABBITMQ_PASS", "guest")

def get_connection():
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    parameters = pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials)
    return pika.BlockingConnection(parameters)

def publish_message(routing_key, message):
    try:
        connection = get_connection()
        channel = connection.channel()
        channel.queue_declare(queue='vehicle_events')
        
        channel.basic_publish(exchange='',
                              routing_key='vehicle_events',
                              body=json.dumps(message))
        connection.close()
    except Exception as e:
        print(f"Failed to publish message: {e}")

async def consume_messages():
    # Placeholder for consuming messages if needed
    pass
