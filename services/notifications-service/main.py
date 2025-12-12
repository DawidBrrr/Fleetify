from fastapi import FastAPI

from app.database import Base, engine
from app.routes import router
from app.messaging import start_consumer

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Notifications Service")
app.include_router(router)

@app.on_event("startup")
def startup_event():
    start_consumer()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "notifications-service"}
