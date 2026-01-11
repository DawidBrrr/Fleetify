from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


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
    vin: str = Field(..., min_length=17, max_length=17, description="Vehicle Identification Number (exactly 17 characters)")
    make: str = Field(..., max_length=50)
    model: str = Field(..., max_length=50)
    year: int = Field(..., ge=1900, le=2100)
    license_plate: str = Field(..., max_length=20)
    status: Optional[str] = "available"
    fuel_type: Optional[str] = "gasoline"
    fuel_level: Optional[int] = 100
    fuel_capacity: Optional[float] = None
    battery_level: Optional[int] = None
    odometer: Optional[int] = 0
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    last_service_date: Optional[datetime] = None
    current_driver_id: Optional[str] = None

    @field_validator('vin')
    @classmethod
    def validate_vin(cls, v):
        if len(v) != 17:
            raise ValueError('VIN musi mieć dokładnie 17 znaków')
        return v.upper()

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    status: Optional[str] = None
    fuel_type: Optional[str] = None
    fuel_level: Optional[int] = None
    fuel_capacity: Optional[float] = None
    battery_level: Optional[int] = None
    odometer: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    city: Optional[str] = None
    last_service_date: Optional[datetime] = None
    current_driver_id: Optional[str] = None

class Vehicle(VehicleBase):
    id: int
    owner_id: str  # Admin who owns this vehicle
    created_at: datetime
    updated_at: datetime
    issues: List[VehicleIssue] = Field(default_factory=list)
    city: Optional[str] = None

    class Config:
        orm_mode = True
