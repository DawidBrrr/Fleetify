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
    query = db.query(models.TripLog)
    if user_id:
        target = resolve_target_user(current_user, user_id)
        query = query.filter(models.TripLog.user_id == target)
    elif current_user.get("role") != "admin":
        query = query.filter(models.TripLog.user_id == current_user["id"])
    query = query.order_by(models.TripLog.created_at.desc())
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
    query = db.query(models.FuelLog)
    if user_id:
        target = resolve_target_user(current_user, user_id)
        query = query.filter(models.FuelLog.user_id == target)
    elif current_user.get("role") != "admin":
        query = query.filter(models.FuelLog.user_id == current_user["id"])
    query = query.order_by(models.FuelLog.created_at.desc())
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


# ==================== CHART ENDPOINTS ====================

from sqlalchemy import func as sql_func, cast, Date
from datetime import timedelta

@app.get("/analytics/charts/fuel-consumption")
def get_fuel_consumption_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    group_by: str = "day",  # day, week, month
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz dane o zużyciu paliwa w czasie dla wykresów"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        cast(models.FuelLog.created_at, Date).label("date"),
        sql_func.sum(models.FuelLog.liters).label("total_liters"),
        sql_func.sum(models.FuelLog.total_cost).label("total_cost"),
        sql_func.count(models.FuelLog.id).label("refuels_count")
    ).filter(models.FuelLog.created_at >= start_date)
    
    if vehicle_id:
        query = query.filter(models.FuelLog.vehicle_id == vehicle_id)
    
    query = query.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
    results = query.all()
    
    data = []
    for row in results:
        data.append({
            "date": row.date.isoformat() if row.date else None,
            "liters": float(row.total_liters or 0),
            "cost": float(row.total_cost or 0),
            "refuels": row.refuels_count or 0
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/cost-breakdown")
def get_cost_breakdown_chart(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz podział kosztów dla wykresu kołowego"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=days)
    
    # Koszty z tabeli user_costs
    costs_query = db.query(
        models.UserCost.category,
        sql_func.sum(models.UserCost.amount).label("total")
    ).filter(
        models.UserCost.created_at >= start_date
    ).group_by(models.UserCost.category).all()
    
    # Koszty paliwa z fuel_logs
    fuel_cost = db.query(
        sql_func.sum(models.FuelLog.total_cost)
    ).filter(models.FuelLog.created_at >= start_date).scalar() or 0
    
    # Koszty opłat drogowych z trip_logs
    tolls_cost = db.query(
        sql_func.sum(models.TripLog.tolls_cost)
    ).filter(models.TripLog.created_at >= start_date).scalar() or 0
    
    data = []
    for row in costs_query:
        data.append({
            "category": row.category,
            "amount": float(row.total or 0)
        })
    
    # Dodaj koszty paliwa jeśli nie ma w costs
    fuel_exists = any(d["category"].lower() == "paliwo" for d in data)
    if not fuel_exists and fuel_cost > 0:
        data.append({"category": "Paliwo", "amount": float(fuel_cost)})
    
    if tolls_cost > 0:
        data.append({"category": "Opłaty drogowe", "amount": float(tolls_cost)})
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/vehicle-mileage")
def get_vehicle_mileage_chart(
    days: int = 30,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz przebieg per pojazd dla wykresu słupkowego"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label,
        sql_func.sum(models.TripLog.distance_km).label("total_km"),
        sql_func.count(models.TripLog.id).label("trips_count")
    ).filter(
        models.TripLog.created_at >= start_date,
        models.TripLog.vehicle_id.isnot(None)
    ).group_by(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label
    ).order_by(sql_func.sum(models.TripLog.distance_km).desc()).limit(limit)
    
    results = query.all()
    
    data = []
    for row in results:
        data.append({
            "vehicle_id": row.vehicle_id,
            "vehicle_label": row.vehicle_label or row.vehicle_id,
            "distance_km": float(row.total_km or 0),
            "trips_count": row.trips_count or 0
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/fuel-efficiency")
def get_fuel_efficiency_chart(
    days: int = 30,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz efektywność paliwową (l/100km) w czasie"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=days)
    
    query = db.query(
        cast(models.TripLog.created_at, Date).label("date"),
        sql_func.sum(models.TripLog.distance_km).label("total_km"),
        sql_func.sum(models.TripLog.fuel_used_l).label("total_fuel")
    ).filter(
        models.TripLog.created_at >= start_date,
        models.TripLog.distance_km > 0,
        models.TripLog.fuel_used_l > 0
    )
    
    if vehicle_id:
        query = query.filter(models.TripLog.vehicle_id == vehicle_id)
    
    query = query.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
    results = query.all()
    
    data = []
    for row in results:
        total_km = float(row.total_km or 0)
        total_fuel = float(row.total_fuel or 0)
        efficiency = (total_fuel / total_km * 100) if total_km > 0 else 0
        
        data.append({
            "date": row.date.isoformat() if row.date else None,
            "efficiency": round(efficiency, 2),
            "distance_km": total_km,
            "fuel_used_l": total_fuel
        })
    
    return {"data": data, "period_days": days}


@app.get("/analytics/charts/cost-trend")
def get_cost_trend_chart(
    months: int = 6,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz trend kosztów miesięcznych"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=months * 30)
    
    # Koszty paliwa per miesiąc
    fuel_query = db.query(
        sql_func.date_trunc('month', models.FuelLog.created_at).label("month"),
        sql_func.sum(models.FuelLog.total_cost).label("fuel_cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    )
    if vehicle_id:
        fuel_query = fuel_query.filter(models.FuelLog.vehicle_id == vehicle_id)
    fuel_query = fuel_query.group_by(sql_func.date_trunc('month', models.FuelLog.created_at))
    
    fuel_results = {row.month: float(row.fuel_cost or 0) for row in fuel_query.all()}
    
    # Koszty opłat drogowych per miesiąc
    tolls_query = db.query(
        sql_func.date_trunc('month', models.TripLog.created_at).label("month"),
        sql_func.sum(models.TripLog.tolls_cost).label("tolls_cost")
    ).filter(
        models.TripLog.created_at >= start_date
    )
    if vehicle_id:
        tolls_query = tolls_query.filter(models.TripLog.vehicle_id == vehicle_id)
    tolls_query = tolls_query.group_by(sql_func.date_trunc('month', models.TripLog.created_at))
    
    tolls_results = {row.month: float(row.tolls_cost or 0) for row in tolls_query.all()}
    
    # Połącz dane
    all_months = set(fuel_results.keys()) | set(tolls_results.keys())
    
    data = []
    for month in sorted(all_months):
        if month:
            data.append({
                "month": month.strftime("%Y-%m"),
                "month_label": month.strftime("%b %Y"),
                "fuel_cost": fuel_results.get(month, 0),
                "tolls_cost": tolls_results.get(month, 0),
                "total_cost": fuel_results.get(month, 0) + tolls_results.get(month, 0)
            })
    
    return {"data": data, "period_months": months}


@app.get("/analytics/charts/fleet-summary")
def get_fleet_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz podsumowanie statystyk floty"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    today = datetime.now()
    month_start = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (month_start - timedelta(days=1)).replace(day=1)
    
    # Statystyki bieżącego miesiąca
    current_fuel = db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
        models.FuelLog.created_at >= month_start
    ).scalar() or 0
    
    current_distance = db.query(sql_func.sum(models.TripLog.distance_km)).filter(
        models.TripLog.created_at >= month_start
    ).scalar() or 0
    
    current_trips = db.query(sql_func.count(models.TripLog.id)).filter(
        models.TripLog.created_at >= month_start
    ).scalar() or 0
    
    # Statystyki poprzedniego miesiąca (do porównania)
    last_fuel = db.query(sql_func.sum(models.FuelLog.total_cost)).filter(
        models.FuelLog.created_at >= last_month_start,
        models.FuelLog.created_at < month_start
    ).scalar() or 0
    
    last_distance = db.query(sql_func.sum(models.TripLog.distance_km)).filter(
        models.TripLog.created_at >= last_month_start,
        models.TripLog.created_at < month_start
    ).scalar() or 0
    
    # Oblicz zmiany procentowe
    def calc_delta(current, last):
        if last == 0:
            return "+100%" if current > 0 else "0%"
        change = ((current - last) / last) * 100
        return f"{'+' if change >= 0 else ''}{change:.0f}%"
    
    return {
        "current_month": {
            "fuel_cost": float(current_fuel),
            "total_distance_km": float(current_distance),
            "trips_count": current_trips
        },
        "deltas": {
            "fuel_cost": calc_delta(float(current_fuel), float(last_fuel)),
            "distance": calc_delta(float(current_distance), float(last_distance))
        },
        "period": month_start.strftime("%B %Y")
    }


@app.get("/analytics/vehicles-list")
def get_vehicles_list(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Pobierz listę unikalnych pojazdów do filtrów"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Pobierz unikalne pojazdy z trip_logs i fuel_logs
    trip_vehicles = db.query(
        models.TripLog.vehicle_id,
        models.TripLog.vehicle_label
    ).filter(models.TripLog.vehicle_id.isnot(None)).distinct().all()
    
    fuel_vehicles = db.query(
        models.FuelLog.vehicle_id,
        models.FuelLog.vehicle_label
    ).filter(models.FuelLog.vehicle_id.isnot(None)).distinct().all()
    
    # Połącz i deduplikuj
    vehicles_map = {}
    for v in trip_vehicles + fuel_vehicles:
        if v.vehicle_id and v.vehicle_id not in vehicles_map:
            vehicles_map[v.vehicle_id] = v.vehicle_label or v.vehicle_id
    
    vehicles = [{"id": k, "label": v} for k, v in vehicles_map.items()]
    
    return {"vehicles": vehicles}


# ==================== PREDICTION ENDPOINTS ====================

import numpy as np
from sklearn.linear_model import LinearRegression

@app.get("/analytics/charts/cost-prediction")
def get_cost_prediction(
    history_days: int = 90,
    predict_days: int = 30,
    vehicle_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Predykcja kosztów na podstawie regresji liniowej.
    Analizuje dane historyczne i przewiduje koszty na następne dni.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=history_days)
    
    # Pobierz dzienne koszty paliwa
    fuel_query = db.query(
        cast(models.FuelLog.created_at, Date).label("date"),
        sql_func.sum(models.FuelLog.total_cost).label("cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    )
    if vehicle_id:
        fuel_query = fuel_query.filter(models.FuelLog.vehicle_id == vehicle_id)
    fuel_query = fuel_query.group_by(cast(models.FuelLog.created_at, Date)).order_by("date")
    
    fuel_data = {row.date: float(row.cost or 0) for row in fuel_query.all()}
    
    # Pobierz dzienne koszty opłat drogowych
    tolls_query = db.query(
        cast(models.TripLog.created_at, Date).label("date"),
        sql_func.sum(models.TripLog.tolls_cost).label("cost")
    ).filter(
        models.TripLog.created_at >= start_date
    )
    if vehicle_id:
        tolls_query = tolls_query.filter(models.TripLog.vehicle_id == vehicle_id)
    tolls_query = tolls_query.group_by(cast(models.TripLog.created_at, Date)).order_by("date")
    
    tolls_data = {row.date: float(row.cost or 0) for row in tolls_query.all()}
    
    # Połącz dane w serie czasowe
    all_dates = sorted(set(fuel_data.keys()) | set(tolls_data.keys()))
    
    if len(all_dates) < 3:
        return {
            "historical": [],
            "prediction": [],
            "model_stats": {"error": "Za mało danych do predykcji (min. 3 dni)"},
            "summary": {}
        }
    
    # Przygotuj dane do regresji
    base_date = all_dates[0]
    historical = []
    X_train = []
    y_train = []
    
    for date in all_dates:
        day_index = (date - base_date).days
        fuel_cost = fuel_data.get(date, 0)
        tolls_cost = tolls_data.get(date, 0)
        total_cost = fuel_cost + tolls_cost
        
        historical.append({
            "date": date.isoformat(),
            "day_index": day_index,
            "fuel_cost": fuel_cost,
            "tolls_cost": tolls_cost,
            "total_cost": total_cost,
            "is_prediction": False
        })
        
        X_train.append([day_index])
        y_train.append(total_cost)
    
    # Trenuj model regresji liniowej
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Oblicz metryki modelu
    y_pred_train = model.predict(X_train)
    ss_res = np.sum((y_train - y_pred_train) ** 2)
    ss_tot = np.sum((y_train - np.mean(y_train)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Przewiduj na następne dni
    last_day_index = (all_dates[-1] - base_date).days
    prediction = []
    
    for i in range(1, predict_days + 1):
        future_day_index = last_day_index + i
        future_date = all_dates[-1] + timedelta(days=i)
        predicted_cost = max(0, model.predict([[future_day_index]])[0])  # Nie może być ujemne
        
        prediction.append({
            "date": future_date.isoformat(),
            "day_index": future_day_index,
            "predicted_cost": round(predicted_cost, 2),
            "is_prediction": True
        })
    
    # Podsumowanie
    total_historical = sum(y_train)
    avg_daily = total_historical / len(y_train) if len(y_train) > 0 else 0
    total_predicted = sum(p["predicted_cost"] for p in prediction)
    
    # Trend (wzrost/spadek dzienny)
    daily_trend = model.coef_[0]
    trend_direction = "wzrostowy" if daily_trend > 0 else "spadkowy" if daily_trend < 0 else "stabilny"
    
    return {
        "historical": historical,
        "prediction": prediction,
        "model_stats": {
            "r_squared": round(r_squared, 4),
            "daily_trend": round(daily_trend, 2),
            "trend_direction": trend_direction,
            "intercept": round(model.intercept_, 2),
            "data_points": len(all_dates)
        },
        "summary": {
            "total_historical_cost": round(total_historical, 2),
            "avg_daily_cost": round(avg_daily, 2),
            "predicted_next_period_cost": round(total_predicted, 2),
            "history_days": history_days,
            "predict_days": predict_days
        }
    }


@app.get("/analytics/charts/monthly-prediction")
def get_monthly_prediction(
    history_months: int = 6,
    predict_months: int = 3,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Predykcja miesięcznych kosztów na podstawie regresji liniowej.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    start_date = datetime.now() - timedelta(days=history_months * 30)
    
    # Pobierz miesięczne koszty paliwa
    fuel_query = db.query(
        sql_func.date_trunc('month', models.FuelLog.created_at).label("month"),
        sql_func.sum(models.FuelLog.total_cost).label("cost")
    ).filter(
        models.FuelLog.created_at >= start_date
    ).group_by(sql_func.date_trunc('month', models.FuelLog.created_at))
    
    fuel_data = {row.month: float(row.cost or 0) for row in fuel_query.all()}
    
    # Pobierz miesięczne koszty opłat
    tolls_query = db.query(
        sql_func.date_trunc('month', models.TripLog.created_at).label("month"),
        sql_func.sum(models.TripLog.tolls_cost).label("cost")
    ).filter(
        models.TripLog.created_at >= start_date
    ).group_by(sql_func.date_trunc('month', models.TripLog.created_at))
    
    tolls_data = {row.month: float(row.cost or 0) for row in tolls_query.all()}
    
    # Połącz dane
    all_months = sorted(set(fuel_data.keys()) | set(tolls_data.keys()))
    
    if len(all_months) < 2:
        return {
            "historical": [],
            "prediction": [],
            "model_stats": {"error": "Za mało danych do predykcji (min. 2 miesiące)"},
            "summary": {}
        }
    
    # Przygotuj dane
    historical = []
    X_train = []
    y_train = []
    
    for i, month in enumerate(all_months):
        fuel_cost = fuel_data.get(month, 0)
        tolls_cost = tolls_data.get(month, 0)
        total_cost = fuel_cost + tolls_cost
        
        historical.append({
            "month": month.strftime("%Y-%m"),
            "month_label": month.strftime("%b %Y"),
            "month_index": i,
            "fuel_cost": fuel_cost,
            "tolls_cost": tolls_cost,
            "total_cost": total_cost,
            "is_prediction": False
        })
        
        X_train.append([i])
        y_train.append(total_cost)
    
    # Trenuj model
    X_train = np.array(X_train)
    y_train = np.array(y_train)
    
    model = LinearRegression()
    model.fit(X_train, y_train)
    
    # Metryki
    y_pred_train = model.predict(X_train)
    ss_res = np.sum((y_train - y_pred_train) ** 2)
    ss_tot = np.sum((y_train - np.mean(y_train)) ** 2)
    r_squared = 1 - (ss_res / ss_tot) if ss_tot != 0 else 0
    
    # Predykcja
    prediction = []
    last_month = all_months[-1]
    
    for i in range(1, predict_months + 1):
        future_index = len(all_months) - 1 + i
        # Oblicz przyszły miesiąc
        future_month = last_month + timedelta(days=32 * i)
        future_month = future_month.replace(day=1)
        
        predicted_cost = max(0, model.predict([[future_index]])[0])
        
        prediction.append({
            "month": future_month.strftime("%Y-%m"),
            "month_label": future_month.strftime("%b %Y"),
            "month_index": future_index,
            "predicted_cost": round(predicted_cost, 2),
            "is_prediction": True
        })
    
    # Podsumowanie
    monthly_trend = model.coef_[0]
    trend_direction = "wzrostowy" if monthly_trend > 50 else "spadkowy" if monthly_trend < -50 else "stabilny"
    
    return {
        "historical": historical,
        "prediction": prediction,
        "model_stats": {
            "r_squared": round(r_squared, 4),
            "monthly_trend": round(monthly_trend, 2),
            "trend_direction": trend_direction,
            "data_points": len(all_months)
        },
        "summary": {
            "avg_monthly_cost": round(np.mean(y_train), 2),
            "predicted_next_months_total": round(sum(p["predicted_cost"] for p in prediction), 2)
        }
    }


