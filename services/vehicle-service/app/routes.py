from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import IntegrityError
from typing import Any, Dict, List, Optional

from . import models, schemas, database, messaging
from .deps import get_current_user, get_owner_id

router = APIRouter()


def _iso(value):
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else value


def _serialize_vehicle(vehicle: models.Vehicle) -> Dict[str, Any]:
    return {
        "vehicle_id": vehicle.id,
        "owner_id": vehicle.owner_id,
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
        "latitude": vehicle.latitude,
        "longitude": vehicle.longitude,
        "city": vehicle.city,
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
    payload["event_type"] = event_name
    payload["vehicle_label"] = f"{vehicle.make} {vehicle.model}"
    if extra:
        payload.update(extra)
    messaging.publish_message(event_name, payload)


@router.post("/vehicles/", response_model=schemas.Vehicle)
async def create_vehicle(
    vehicle: schemas.VehicleCreate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can create vehicles
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create vehicles")
    
    # Set owner_id to current admin's ID
    vehicle_data = vehicle.dict()
    vehicle_data["owner_id"] = current_user["id"]
    
    db_vehicle = models.Vehicle(**vehicle_data)
    db.add(db_vehicle)
    
    try:
        db.commit()
        db.refresh(db_vehicle)
    except IntegrityError as e:
        db.rollback()
        error_msg = str(e.orig) if e.orig else str(e)
        if "vehicles_vin_key" in error_msg:
            raise HTTPException(
                status_code=409, 
                detail=f"Vehicle with VIN '{vehicle.vin}' already exists"
            )
        elif "vehicles_license_plate_key" in error_msg:
            raise HTTPException(
                status_code=409, 
                detail=f"Vehicle with license plate '{vehicle.license_plate}' already exists"
            )
        else:
            raise HTTPException(status_code=400, detail="Vehicle data violates database constraints")

    _emit_vehicle_event("vehicle_created", db_vehicle)

    return db_vehicle

@router.get("/vehicles/", response_model=List[schemas.Vehicle])
async def read_vehicles(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    # Get owner_id based on user role (admin's own ID or employee's manager ID)
    owner_id = get_owner_id(current_user)
    
    vehicles = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.owner_id == owner_id)  # Filter by owner!
        .options(joinedload(models.Vehicle.issues))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return vehicles

@router.get("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
async def read_vehicle(
    vehicle_id: int, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)
    
    vehicle = (
        db.query(models.Vehicle)
        .options(joinedload(models.Vehicle.issues))
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)  # Security: only own vehicles
        .first()
    )
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.put("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
async def update_vehicle(
    vehicle_id: int, 
    vehicle_update: schemas.VehicleUpdate, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    # Only admins can update vehicles
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update vehicles")
    
    owner_id = get_owner_id(current_user)
    
    db_vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)  # Security: only own vehicles
        .first()
    )
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    update_data = vehicle_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    
    db.commit()
    db.refresh(db_vehicle)

    _emit_vehicle_event("vehicle_updated", db_vehicle, {"updates": _serialize_updates(update_data)})

    # Check if service date update requires an alert
    if "last_service_date" in update_data and db_vehicle.last_service_date:
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        service_date = db_vehicle.last_service_date
        if service_date.tzinfo is None:
            service_date = service_date.replace(tzinfo=timezone.utc)
        one_year = service_date + timedelta(days=365)
        days_remaining = (one_year - now).days
        
        if days_remaining < 0:
            _emit_vehicle_event("vehicle_service_alert", db_vehicle, {
                "severity": "critical",
                "message": f"Serwis przeterminowany o {abs(days_remaining)} dni!",
                "days_remaining": days_remaining,
            })
        elif days_remaining <= 30:
            _emit_vehicle_event("vehicle_service_alert", db_vehicle, {
                "severity": "high",
                "message": f"Serwis za {days_remaining} dni",
                "days_remaining": days_remaining,
            })

    return db_vehicle


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a vehicle from the fleet. Only admins can delete vehicles.
    Vehicle must not be currently assigned to anyone.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete vehicles")
    
    owner_id = get_owner_id(current_user)
    
    db_vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)
        .first()
    )
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if vehicle is currently assigned
    if db_vehicle.current_driver_id:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete vehicle that is currently assigned to an employee. Please unassign it first."
        )
    
    # Store data for event before deletion
    vehicle_data = _serialize_vehicle(db_vehicle)
    
    db.delete(db_vehicle)
    db.commit()
    
    messaging.publish_message("vehicle_deleted", vehicle_data)
    
    return None


@router.get("/vehicles/{vehicle_id}/issues", response_model=List[schemas.VehicleIssue])
async def list_vehicle_issues(
    vehicle_id: int, 
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)
    
    vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)
        .first()
    )
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
async def create_vehicle_issue(
    vehicle_id: int,
    payload: schemas.VehicleIssueCreate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)
    
    vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)
        .first()
    )
    if vehicle is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")

    issue = models.VehicleIssue(
        vehicle_id=vehicle_id,
        reporter_id=payload.reporter_id or current_user.get("id"),
        severity=payload.severity or "medium",
        title=payload.title,
        description=payload.description,
    )
    db.add(issue)
    
    # Auto-set vehicle to maintenance if issue is high or critical severity
    if issue.severity in ("high", "critical"):
        vehicle.status = "maintenance"
    
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


@router.post("/vehicles/{vehicle_id}/return")
async def return_vehicle(
    vehicle_id: int,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Allows an employee to return a vehicle assigned to them.
    Sets status to 'available' and clears current_driver_id.
    """
    user_id = str(current_user.get("id"))
    owner_id = get_owner_id(current_user)
    
    db_vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)
        .first()
    )
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Verify the vehicle is assigned to this employee (compare as strings)
    vehicle_driver = str(db_vehicle.current_driver_id) if db_vehicle.current_driver_id else None
    if vehicle_driver != user_id:
        raise HTTPException(
            status_code=403, 
            detail="You can only return vehicles assigned to you"
        )
    
    # Return the vehicle
    db_vehicle.status = "available"
    db_vehicle.current_driver_id = None
    
    db.commit()
    db.refresh(db_vehicle)
    
    _emit_vehicle_event("vehicle_returned", db_vehicle, {"returned_by": user_id})
    
    return {"status": "success", "message": "Vehicle returned successfully"}


@router.patch("/vehicles/{vehicle_id}/issues/{issue_id}", response_model=schemas.VehicleIssue)
async def update_vehicle_issue(
    vehicle_id: int,
    issue_id: int,
    payload: schemas.VehicleIssueUpdate,
    db: Session = Depends(database.get_db),
    current_user: dict = Depends(get_current_user)
):
    owner_id = get_owner_id(current_user)
    
    vehicle = (
        db.query(models.Vehicle)
        .filter(models.Vehicle.id == vehicle_id)
        .filter(models.Vehicle.owner_id == owner_id)
        .first()
    )
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
    
    # Auto-restore vehicle to available when issue is resolved
    if issue.status == "resolved" and vehicle.status == "maintenance":
        # Check if there are no other open high/critical issues
        open_critical_issues = (
            db.query(models.VehicleIssue)
            .filter(
                models.VehicleIssue.vehicle_id == vehicle_id,
                models.VehicleIssue.id != issue_id,
                models.VehicleIssue.status != "resolved",
                models.VehicleIssue.severity.in_(["high", "critical"])
            )
            .count()
        )
        if open_critical_issues == 0:
            vehicle.status = "available"
    
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
