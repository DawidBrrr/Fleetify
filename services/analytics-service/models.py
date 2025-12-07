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
