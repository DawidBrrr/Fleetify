from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from . import models, schemas, database, messaging

router = APIRouter()

@router.post("/vehicles/", response_model=schemas.Vehicle)
def create_vehicle(vehicle: schemas.VehicleCreate, db: Session = Depends(database.get_db)):
    db_vehicle = models.Vehicle(**vehicle.dict())
    db.add(db_vehicle)
    db.commit()
    db.refresh(db_vehicle)
    
    # Publish event
    messaging.publish_message("vehicle_created", {"id": db_vehicle.id, "vin": db_vehicle.vin})
    
    return db_vehicle

@router.get("/vehicles/", response_model=List[schemas.Vehicle])
def read_vehicles(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    vehicles = db.query(models.Vehicle).offset(skip).limit(limit).all()
    return vehicles

@router.get("/vehicles/{vehicle_id}", response_model=schemas.Vehicle)
def read_vehicle(vehicle_id: int, db: Session = Depends(database.get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
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
    
    # Publish event
    messaging.publish_message("vehicle_updated", {"id": db_vehicle.id, "vin": db_vehicle.vin, "updates": update_data})
    
    return db_vehicle
