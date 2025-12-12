import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Enum, JSON, String
from sqlalchemy.dialects.postgresql import UUID

from .database import Base

NOTIFICATION_STATUSES = ("unread", "read", "pending", "accepted", "declined", "dismissed")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_id = Column(UUID(as_uuid=True), nullable=False)
    sender_id = Column(UUID(as_uuid=True), nullable=True)
    type = Column(String, nullable=False)
    title = Column(String, nullable=False)
    body = Column(String, nullable=False)
    metadata_payload = Column("metadata", JSON, nullable=False, default=dict)
    status = Column(String, nullable=False, default="unread")
    action_required = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    responded_at = Column(DateTime, nullable=True)

    def mark(self, status: str):
        self.status = status
        self.updated_at = datetime.utcnow()

    def respond(self, status: str):
        self.status = status
        self.responded_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


def _get_metadata(self):
    return self.metadata_payload or {}


def _set_metadata(self, value):
    self.metadata_payload = value or {}


Notification.metadata = property(_get_metadata, _set_metadata)
