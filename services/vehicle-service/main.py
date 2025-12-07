from fastapi import FastAPI
from app.routes import router
import asyncio
from app.messaging import consume_messages

app = FastAPI(title="Vehicle Service")

app.include_router(router)

@app.on_event("startup")
async def startup_event():
    # Start RabbitMQ consumer in background
    asyncio.create_task(consume_messages())

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "vehicle-service"}
