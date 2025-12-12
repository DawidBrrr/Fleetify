from datetime import datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, Field

class NotificationBase(BaseModel):
    recipient_id: UUID
    sender_id: Optional[UUID] = None
    type: str
    title: str
    body: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    action_required: bool = False
    status: str = "unread"

class NotificationCreate(NotificationBase):
    pass

class NotificationOut(BaseModel):
    id: UUID
    recipient_id: UUID
    sender_id: Optional[UUID]
    type: str
    title: str
    body: str
    metadata: dict[str, Any]
    status: str
    action_required: bool
    created_at: datetime
    updated_at: datetime
    responded_at: Optional[datetime]

    class Config:
        orm_mode = True

class NotificationAction(BaseModel):
    action: str = Field(pattern="^(ack|accept|decline)$")
