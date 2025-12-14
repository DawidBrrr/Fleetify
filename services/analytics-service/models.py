from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class UserStat(Base):
    __tablename__ = "user_stats"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    label = Column(String(50), nullable=False)
    value = Column(Integer, nullable=False)
    delta = Column(String(10))
    tone = Column(String(20), default='info')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserCost(Base):
    __tablename__ = "user_costs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    category = Column(String(50), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserAlert(Base):
    __tablename__ = "user_alerts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    type = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default='info')
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserAssignment(Base):
    __tablename__ = "user_assignments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    vehicle_id = Column(String(50), nullable=False)
    vehicle_model = Column(String(100))
    vehicle_vin = Column(String(50))
    vehicle_mileage = Column(String(50))
    vehicle_battery = Column(Integer)
    vehicle_tire_pressure = Column(String(20))
    task_json = Column(Text) # Storing tasks as JSON string for simplicity
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserTrip(Base):
    __tablename__ = "user_trips"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    route = Column(String(200))
    distance = Column(String(50))
    cost = Column(String(50))
    efficiency = Column(String(10))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class UserReminder(Base):
    __tablename__ = "user_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    message = Column(Text, nullable=False)
    severity = Column(String(20), default='info')
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class TripLog(Base):
    __tablename__ = "trip_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    vehicle_id = Column(String(50), nullable=True)
    vehicle_label = Column(String(120), nullable=True)
    route_label = Column(String(200), nullable=True)
    distance_km = Column(Numeric(10, 2), nullable=True)
    fuel_used_l = Column(Numeric(10, 2), nullable=True)
    fuel_cost = Column(Numeric(10, 2), nullable=True)
    tolls_cost = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), nullable=False)
    vehicle_id = Column(String(50), nullable=True)
    vehicle_label = Column(String(120), nullable=True)
    liters = Column(Numeric(10, 2), nullable=False)
    price_per_liter = Column(Numeric(10, 2), nullable=True)
    total_cost = Column(Numeric(10, 2), nullable=True)
    station = Column(String(120), nullable=True)
    odometer = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
