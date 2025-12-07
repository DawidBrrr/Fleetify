from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class VehicleBase(BaseModel):
    vin: str
    make: str
    model: str
    year: int
    license_plate: str
    status: Optional[str] = "available"
    fuel_type: Optional[str] = "gasoline"
    fuel_level: Optional[int] = 100
    fuel_capacity: Optional[float] = None
    battery_level: Optional[int] = None
    odometer: Optional[int] = 0
    last_service_date: Optional[datetime] = None
    current_driver_id: Optional[str] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    status: Optional[str] = None
    fuel_type: Optional[str] = None
    fuel_level: Optional[int] = None
    fuel_capacity: Optional[float] = None
    battery_level: Optional[int] = None
    odometer: Optional[int] = None
    last_service_date: Optional[datetime] = None
    current_driver_id: Optional[str] = None

class Vehicle(VehicleBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
