from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class VehicleIssueBase(BaseModel):
    title: str
    description: str
    severity: Optional[str] = "medium"
    reporter_id: Optional[str] = None


class VehicleIssueCreate(VehicleIssueBase):
    pass


class VehicleIssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    status: Optional[str] = None
    resolved_at: Optional[datetime] = None


class VehicleIssue(BaseModel):
    id: int
    vehicle_id: int
    title: str
    description: str
    severity: str
    status: str
    reporter_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        orm_mode = True

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
    issues: List[VehicleIssue] = Field(default_factory=list)

    class Config:
        orm_mode = True
