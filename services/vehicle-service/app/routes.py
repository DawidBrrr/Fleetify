from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import Any, Dict, List, Optional

from . import models, schemas, database, messaging

router = APIRouter()


def _iso(value):
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else value


def _serialize_vehicle(vehicle: models.Vehicle) -> Dict[str, Any]:
    return {
        "vehicle_id": vehicle.id,
        "vin": vehicle.vin,
        "make": vehicle.make,
        "model": vehicle.model,
        "year": vehicle.year,
        "license_plate": vehicle.license_plate,
        "status": vehicle.status,
        "fuel_type": vehicle.fuel_type,
        "fuel_level": vehicle.fuel_level,
        "fuel_capacity": vehicle.fuel_capacity,
        "battery_level": vehicle.battery_level,
        "odometer": vehicle.odometer,
        "current_driver_id": vehicle.current_driver_id,
        "last_service_date": _iso(vehicle.last_service_date),
        "created_at": _iso(vehicle.created_at),
        "updated_at": _iso(vehicle.updated_at),
    }


def _serialize_issue(issue: models.VehicleIssue) -> Dict[str, Any]:
    return {
        "id": issue.id,
        "vehicle_id": issue.vehicle_id,
        "reporter_id": issue.reporter_id,
        "severity": issue.severity,
        "title": issue.title,
        "description": issue.description,
        "status": issue.status,
        "created_at": _iso(issue.created_at),
        "updated_at": _iso(issue.updated_at),
        "resolved_at": _iso(issue.resolved_at),
    }


def _serialize_updates(updates: Dict[str, Any]) -> Dict[str, Any]:
    serialized: Dict[str, Any] = {}
    for key, value in updates.items():
        serialized[key] = _iso(value) if hasattr(value, "isoformat") else value
    return serialized


def _emit_vehicle_event(event_name: str, vehicle: models.Vehicle, extra: Optional[Dict[str, Any]] = None) -> None:
    payload = _serialize_vehicle(vehicle)
    if extra:
        payload.update(extra)
    messaging.publish_message(event_name, payload)


@router.post("/vehicles/", response_model=schemas.Vehicle)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(database.get_db)):
    db_vehicle = models.Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)

    _emit_vehicle_event("vehicle_created", db_vehicle)

    return db_vehicle

@router.get("/vehicles/", response_model=List[schemas.Vehicle])
def read_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    vehicles = (
        db.query(models.Vehicle)
        .options(joinedload(models.Vehicle.issues))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return vehicles

@router.get("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def read_vehicle(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = (
        db.query(models.Vehicle)
        .options(joinedload(models.Vehicle.issues))
        .filter(models.Vehicle.id == vehicle_id)
        .first()
    )
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def update_vehicle(vehicle_id: int, vehicle_update: schemas.VehicleUpdate, db: Session = Depends(database.get_db)):
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)

    _emit_vehicle_event("vehicle_updated", db_vehicle, {"updates": _serialize_updates(update_data)})

    return db_vehicle


@router.get("/vehicles/{vehicle_id}/issues", response_model=List[schemas.VehicleIssue])
def list_vehicle_issues(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
    issues = (
        db.query(models.VehicleIssue)
        .filter(models.VehicleIssue.vehicle_id == vehicle_id)
        .order_by(models.VehicleIssue.created_at.desc())
        .all()
    )
    return issues


@router.post("/vehicles/{vehicle_id}/issues", response_model=schemas.VehicleIssue, status_code=status.HTTP_201_CREATED)
def create_vehicle_issue(
    vehicle_id: int,
    payload: schemas.VehicleIssueCreate,
    db: Session = Depends(database.get_db),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    issue = models.VehicleIssue(
        vehicle_id=vehicle_id,
        reporter_id=payload.reporter_id,
        severity=payload.severity or "medium",
        title=payload.title,
        description=payload.description,
    )
    db.add(issue)
    db.commit()
    db.refresh(issue)
    event_payload = {
        "severity": issue.severity,
        "message": issue.title,
        "issue": _serialize_issue(issue),
        "updates": {
            "status": "issue",
            "issue_id": issue.id,
            "severity": issue.severity,
        },
    }
    _emit_vehicle_event("vehicle_issue_created", vehicle, event_payload)
    return issue


@router.patch("/vehicles/{vehicle_id}/issues/{issue_id}", response_model=schemas.VehicleIssue)
def update_vehicle_issue(
    vehicle_id: int,
    issue_id: int,
    payload: schemas.VehicleIssueUpdate,
    db: Session = Depends(database.get_db),
):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    issue = (
        db.query(models.VehicleIssue)
        .filter(
            models.VehicleIssue.id == issue_id,
            models.VehicleIssue.vehicle_id == vehicle_id,
        )
        .first()
    )
    if issue is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    updates = payload.dict(exclude_unset=True)
    for field, value in updates.items():
        setattr(issue, field, value)
    db.commit()
    db.refresh(issue)
    event_updates = _serialize_updates(updates)
    event_updates.update({"issue_id": issue.id, "status": issue.status})
    event_payload = {
        "severity": issue.severity,
        "message": issue.title,
        "issue": _serialize_issue(issue),
        "updates": event_updates,
    }
    _emit_vehicle_event("vehicle_issue_updated", vehicle, event_payload)
    return issue
