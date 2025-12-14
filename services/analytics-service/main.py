from datetime import datetime
from decimal import Decimal
from fastapi import FastAPI, Depends, HTTPException, status
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


class VehicleAssignmentPayload(BaseModel):
    user_id: str
    vehicle_id: str
    vehicle_model: str
    vehicle_vin: str
    vehicle_mileage: Optional[str] = None
    vehicle_battery: Optional[int] = None
    vehicle_tire_pressure: Optional[str] = None


class TaskAssignmentPayload(BaseModel):
    user_id: str
    tasks: List[Dict[str, Any]]

class TaskUpdate(BaseModel):
    task_id: int
    status: str

class VehicleUpdate(BaseModel):
    mileage: str
    battery: int


class TripLogBase(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    route_label: Optional[str] = None
    distance_km: Optional[float] = None
    fuel_used_l: Optional[float] = None
    fuel_cost: Optional[float] = None
    tolls_cost: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    user_id: Optional[str] = None


class TripLogCreate(TripLogBase):
    distance_km: float


class TripLogUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    route_label: Optional[str] = None
    distance_km: Optional[float] = None
    fuel_used_l: Optional[float] = None
    fuel_cost: Optional[float] = None
    tolls_cost: Optional[float] = None
    notes: Optional[str] = None
    started_at: Optional[datetime] = None
    user_id: Optional[str] = None


class FuelLogBase(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    liters: Optional[float] = None
    price_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    station: Optional[str] = None
    odometer: Optional[int] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None


class FuelLogCreate(FuelLogBase):
    liters: float


class FuelLogUpdate(BaseModel):
    vehicle_id: Optional[str] = None
    vehicle_label: Optional[str] = None
    liters: Optional[float] = None
    price_per_liter: Optional[float] = None
    total_cost: Optional[float] = None
    station: Optional[str] = None
    odometer: Optional[int] = None
    notes: Optional[str] = None
    user_id: Optional[str] = None


def decimal_to_float(value: Optional[Decimal]) -> Optional[float]:
    if value is None:
        return None
    return float(value)


def serialize_trip(log: models.TripLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "vehicle_id": log.vehicle_id,
        "vehicle_label": log.vehicle_label,
        "route_label": log.route_label,
        "distance_km": decimal_to_float(log.distance_km),
        "fuel_used_l": decimal_to_float(log.fuel_used_l),
        "fuel_cost": decimal_to_float(log.fuel_cost),
        "tolls_cost": decimal_to_float(log.tolls_cost),
        "notes": log.notes,
        "started_at": log.started_at,
        "created_at": log.created_at,
    }


def serialize_fuel(log: models.FuelLog) -> Dict[str, Any]:
    return {
        "id": log.id,
        "user_id": log.user_id,
        "vehicle_id": log.vehicle_id,
        "vehicle_label": log.vehicle_label,
        "liters": decimal_to_float(log.liters),
        "price_per_liter": decimal_to_float(log.price_per_liter),
        "total_cost": decimal_to_float(log.total_cost),
        "station": log.station,
        "odometer": log.odometer,
        "notes": log.notes,
        "created_at": log.created_at,
    }


def resolve_target_user(current_user: dict, explicit_user_id: Optional[str]) -> str:
    if explicit_user_id:
        if current_user.get("role") != "admin" and explicit_user_id != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return explicit_user_id
    return current_user["id"]

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


def _get_assignment_record(db: Session, user_id: str) -> Optional[models.UserAssignment]:
    return db.query(models.UserAssignment).filter(models.UserAssignment.user_id == user_id).first()


@app.post("/analytics/admin/assignments/vehicle")
def assign_vehicle_to_employee(
    payload: VehicleAssignmentPayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    assignment = _get_assignment_record(db, payload.user_id)
    if assignment:
        assignment.vehicle_id = payload.vehicle_id
        assignment.vehicle_model = payload.vehicle_model
        assignment.vehicle_vin = payload.vehicle_vin
        assignment.vehicle_mileage = payload.vehicle_mileage
        assignment.vehicle_battery = payload.vehicle_battery
        assignment.vehicle_tire_pressure = payload.vehicle_tire_pressure
    else:
        assignment = models.UserAssignment(
            user_id=payload.user_id,
            vehicle_id=payload.vehicle_id,
            vehicle_model=payload.vehicle_model,
            vehicle_vin=payload.vehicle_vin,
            vehicle_mileage=payload.vehicle_mileage,
            vehicle_battery=payload.vehicle_battery,
            vehicle_tire_pressure=payload.vehicle_tire_pressure,
            task_json=json.dumps([]),
        )
        db.add(assignment)

    db.commit()
    db.refresh(assignment)
    return {"status": "success", "id": assignment.id}


@app.post("/analytics/admin/assignments/tasks")
def assign_tasks_to_employee(
    payload: TaskAssignmentPayload,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    assignment = _get_assignment_record(db, payload.user_id)
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle must be assigned before tasks")

    assignment.task_json = json.dumps(payload.tasks or [])
    db.commit()
    return {"status": "success", "tasks_count": len(payload.tasks or [])}

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

@app.get("/analytics/trips")
def list_trip_logs(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, user_id)
    query = (
        db.query(models.TripLog)
        .filter(models.TripLog.user_id == target)
        .order_by(models.TripLog.created_at.desc())
    )
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [serialize_trip(log) for log in logs]


@app.post("/analytics/trips")
def create_trip_log(
    payload: TripLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, payload.user_id)
    log = models.TripLog(
        user_id=target,
        vehicle_id=payload.vehicle_id,
        vehicle_label=payload.vehicle_label,
        route_label=payload.route_label,
        distance_km=payload.distance_km,
        fuel_used_l=payload.fuel_used_l,
        fuel_cost=payload.fuel_cost,
        tolls_cost=payload.tolls_cost,
        notes=payload.notes,
        started_at=payload.started_at or datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return serialize_trip(log)


@app.put("/analytics/trips/{trip_id}")
def update_trip_log(
    trip_id: int,
    payload: TripLogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = payload.dict(exclude_unset=True)
    target_user = updates.pop("user_id", None)
    if target_user:
        if current_user.get("role") != "admin" and target_user != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        log.user_id = target_user
    for field, value in updates.items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return serialize_trip(log)


@app.delete("/analytics/trips/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip_log(
    trip_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.TripLog).filter(models.TripLog.id == trip_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    db.delete(log)
    db.commit()
    return {"status": "deleted"}


@app.get("/analytics/fuel-logs")
def list_fuel_logs(
    user_id: Optional[str] = None,
    limit: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, user_id)
    query = (
        db.query(models.FuelLog)
        .filter(models.FuelLog.user_id == target)
        .order_by(models.FuelLog.created_at.desc())
    )
    if limit:
        query = query.limit(limit)
    logs = query.all()
    return [serialize_fuel(log) for log in logs]


@app.post("/analytics/fuel-logs")
def create_fuel_log(
    payload: FuelLogCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    target = resolve_target_user(current_user, payload.user_id)
    log = models.FuelLog(
        user_id=target,
        vehicle_id=payload.vehicle_id,
        vehicle_label=payload.vehicle_label,
        liters=payload.liters,
        price_per_liter=payload.price_per_liter,
        total_cost=payload.total_cost,
        station=payload.station,
        odometer=payload.odometer,
        notes=payload.notes,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return serialize_fuel(log)


@app.put("/analytics/fuel-logs/{log_id}")
def update_fuel_log(
    log_id: int,
    payload: FuelLogUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.FuelLog).filter(models.FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    updates = payload.dict(exclude_unset=True)
    target_user = updates.pop("user_id", None)
    if target_user:
        if current_user.get("role") != "admin" and target_user != current_user["id"]:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
        log.user_id = target_user
    for field, value in updates.items():
        setattr(log, field, value)
    db.commit()
    db.refresh(log)
    return serialize_fuel(log)


@app.delete("/analytics/fuel-logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fuel_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    log = db.query(models.FuelLog).filter(models.FuelLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fuel log not found")
    if current_user.get("role") != "admin" and log.user_id != current_user["id"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    db.delete(log)
    db.commit()
    return {"status": "deleted"}

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
    logs = (
        db.query(models.TripLog)
        .filter(models.TripLog.user_id == user_id)
        .order_by(models.TripLog.created_at.desc())
        .all()
    )
    return [serialize_trip(log) for log in logs]


@app.get("/analytics/employee/fuel-logs")
def get_employee_fuel_logs(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user['id']
    logs = (
        db.query(models.FuelLog)
        .filter(models.FuelLog.user_id == user_id)
        .order_by(models.FuelLog.created_at.desc())
        .all()
    )
    return [serialize_fuel(log) for log in logs]

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
    vehicle_id = assignment.vehicle_id
    
    db.delete(assignment)
    db.commit()
    return {"status": "success", "vehicle_id": vehicle_id}

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
