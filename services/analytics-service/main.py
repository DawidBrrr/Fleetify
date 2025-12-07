from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import models
from database import engine, get_db
from deps import get_current_user
import json

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Analytics Service")

class AssignmentCreate(BaseModel):
    user_id: str
    vehicle_id: str
    vehicle_model: str
    vehicle_vin: str
    vehicle_mileage: str
    vehicle_battery: int
    vehicle_tire_pressure: str
    tasks: List[Dict[str, Any]]

class TaskUpdate(BaseModel):
    task_id: int
    status: str

class VehicleUpdate(BaseModel):
    mileage: str
    battery: int

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analytics-service"}

@app.post("/analytics/admin/assignments")
def create_assignment(
    assignment: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if assignment exists for user
    db_assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == assignment.user_id).first()
    
    if db_assignment:
        # Update existing
        db_assignment.vehicle_id = assignment.vehicle_id
        db_assignment.vehicle_model = assignment.vehicle_model
        db_assignment.vehicle_vin = assignment.vehicle_vin
        db_assignment.vehicle_mileage = assignment.vehicle_mileage
        db_assignment.vehicle_battery = assignment.vehicle_battery
        db_assignment.vehicle_tire_pressure = assignment.vehicle_tire_pressure
        db_assignment.task_json = json.dumps(assignment.tasks)
    else:
        # Create new
        db_assignment = models.UserAssignment(
            user_id=assignment.user_id,
            vehicle_id=assignment.vehicle_id,
            vehicle_model=assignment.vehicle_model,
            vehicle_vin=assignment.vehicle_vin,
            vehicle_mileage=assignment.vehicle_mileage,
            vehicle_battery=assignment.vehicle_battery,
            vehicle_tire_pressure=assignment.vehicle_tire_pressure,
            task_json=json.dumps(assignment.tasks)
        )
        db.add(db_assignment)
    
    db.commit()
    db.refresh(db_assignment)
    return {"status": "success", "id": db_assignment.id}

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

@app.post("/analytics/employee/tasks/update")
def update_task_status(
    update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    tasks = json.loads(assignment.task_json)
    for task in tasks:
        if task['id'] == update.task_id:
            task['status'] = update.status
            break
    
    assignment.task_json = json.dumps(tasks)
    db.commit()
    return {"status": "success"}

@app.post("/analytics/employee/vehicle/return")
def return_vehicle(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    db.commit()
    return {"status": "success"}

@app.post("/analytics/employee/vehicle/update")
def update_vehicle_status(
    update: VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    assignment = db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    assignment.vehicle_mileage = update.mileage
    assignment.vehicle_battery = update.battery
    db.commit()
    return {"status": "success"}
