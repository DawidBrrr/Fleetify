from sqlalchemy import Column, Integer, String, DateTime
from .database import Base
import datetime

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    vin = Column(String, unique=True, index=True)
    make = Column(String)
    model = Column(String)
    year = Column(Integer)
    license_plate = Column(String, unique=True)
    status = Column(String, default="available")
    
    # New fields
    fuel_type = Column(String, default="gasoline") # gasoline, diesel, electric, hybrid
    fuel_level = Column(Integer, default=100) # Percentage
    fuel_capacity = Column(Integer, nullable=True) # Liters
    battery_level = Column(Integer, nullable=True) # Percentage, for electric/hybrid
    odometer = Column(Integer, default=0) # km
    last_service_date = Column(DateTime(timezone=True), nullable=True)
    current_driver_id = Column(String, nullable=True) # User ID
    
    created_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
