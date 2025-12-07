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

import json

@app.get("/analytics/employee/assignment")
def get_employee_assignment(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    
    if not assignment:
        return None # Or empty object depending on frontend expectation

    return {
        "vehicle": {
            "id": assignment.vehicle_id,
            "model": assignment.vehicle_model,
            "vin": assignment.vehicle_vin,
            "mileage": assignment.vehicle_mileage,
            "battery": assignment.vehicle_battery,
            "tirePressure": assignment.vehicle_tire_pressure
        },
        "tasks": json.loads(assignment.task_json) if assignment.task_json else []
    }

@app.get("/analytics/employee/trips")
def get_employee_trips(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    trips = db.query(models.UserTrip).filter(models.UserTrip.user_id == user_id).all()
    return trips

@app.get("/analytics/employee/reminders")
def get_employee_reminders(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    reminders = db.query(models.UserReminder).filter(models.UserReminder.user_id == user_id).all()
    return reminders
