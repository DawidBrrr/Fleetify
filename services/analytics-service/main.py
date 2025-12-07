from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import models
from database import engine, get_db
from deps import get_current_user

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Analytics Service")

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analytics-service"}

@app.get("/analytics/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    stats = db.query(models.UserStat).filter(models.UserStat.user_id == user_id).all()
    return stats

@app.get("/analytics/admin/costs")
def get_admin_costs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    costs = db.query(models.UserCost).filter(models.UserCost.user_id == user_id).all()
    # Transform to dictionary format expected by frontend
    return {cost.category: cost.amount for cost in costs}

@app.get("/analytics/admin/alerts")
def get_admin_alerts(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    alerts = db.query(models.UserAlert).filter(models.UserAlert.user_id == user_id).all()
    return alerts

@app.get("/analytics/admin/fleet-health")
def get_fleet_health(current_user: dict = Depends(get_current_user)):
    # Mock data for now
    return [
        {"id": "V-001", "model": "Toyota Camry", "status": "Active", "location": "Warsaw", "battery": 85},
        {"id": "V-002", "model": "Ford Focus", "status": "Maintenance", "location": "Garage", "battery": 0}
    ]

@app.get("/analytics/employee/assignment")
def get_employee_assignment(current_user: dict = Depends(get_current_user)):
    return {
        "vehicle": {
            "id": "V-001",
            "model": "Toyota Camry",
            "vin": "ABC1234567890",
            "mileage": "12,500 km",
            "battery": 85,
            "tirePressure": "OK"
        },
        "tasks": [
            {"id": 101, "label": "Deliver package to Client A"},
            {"id": 102, "label": "Pick up supplies from Warehouse B"}
        ]
    }

@app.get("/analytics/employee/trips")
def get_employee_trips(current_user: dict = Depends(get_current_user)):
    return [
        {"id": 1, "route": "Warsaw - Krakow", "distance": "300 km", "cost": "150 PLN", "efficiency": "95%"},
        {"id": 2, "route": "Krakow - Warsaw", "distance": "300 km", "cost": "145 PLN", "efficiency": "98%"}
    ]

@app.get("/analytics/employee/reminders")
def get_employee_reminders(current_user: dict = Depends(get_current_user)):
    return [
        {"id": 1, "message": "Check tire pressure", "severity": "info"},
        {"id": 2, "message": "Renew insurance", "severity": "warning"}
    ]
