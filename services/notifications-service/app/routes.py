from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .database import get_db
from . import models, schemas
from .deps import get_current_user, require_service_token
from .service_clients import fetch_admin_ids, set_worker_manager

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("", response_model=List[schemas.NotificationOut])
async def list_notifications(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user_id = current_user["id"]
    return (
        db.query(models.Notification)
        .filter(models.Notification.recipient_id == UUID(user_id))
        .order_by(models.Notification.created_at.desc())
        .all()
    )

@router.post("", response_model=schemas.NotificationOut, status_code=status.HTTP_201_CREATED)
async def create_notification(
    payload: schemas.NotificationCreate,
    _: None = Depends(require_service_token),
    db: Session = Depends(get_db),
):
    notification = models.Notification(**payload.dict())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/{notification_id}/ack", response_model=schemas.NotificationOut)
async def acknowledge_notification(
    notification_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notification.recipient_id) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    notification.mark("read")
    db.commit()
    db.refresh(notification)
    return notification

@router.post("/{notification_id}/respond", response_model=schemas.NotificationOut)
async def respond_to_notification(
    notification_id: UUID,
    action: schemas.NotificationAction,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    if str(notification.recipient_id) != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if action.action not in {"accept", "decline"}:
        raise HTTPException(status_code=400, detail="Unsupported action")

    status_value = "accepted" if action.action == "accept" else "declined"
    notification.respond(status_value)
    db.commit()
    db.refresh(notification)

    if notification.type == "team_invite":
        await handle_team_invite_response(notification, action.action, current_user, db)

    return notification

async def handle_team_invite_response(notification: models.Notification, action: str, current_user: dict, db: Session):
    manager_id = notification.metadata.get("manager_id")
    if action == "accept" and manager_id:
        await set_worker_manager(current_user["id"], manager_id, action="accept")
    if action == "decline":
        await set_worker_manager(current_user["id"], None, action="decline")
    if manager_id:
        follow_up = models.Notification(
            recipient_id=UUID(manager_id),
            sender_id=UUID(current_user["id"]),
            type="team_invite_response",
            title="Odpowiedź na zaproszenie",
            body=f"{current_user['full_name']} {('dołączył' if action == 'accept' else 'odmówił')} zespołu.",
            metadata={"invite_id": str(notification.id), "status": action},
            status="unread",
        )
        db.add(follow_up)
        db.commit()

async def create_vehicle_alert(event_payload: dict, db: Session):
    admins = await fetch_admin_ids()
    if not admins:
        return
    
    event_type = event_payload.get("event_type", "vehicle_alert")
    severity = event_payload.get("severity", "medium")
    vehicle_label = event_payload.get("vehicle_label", "")
    vin = event_payload.get("vin", "")
    
    # Determine title based on event type
    if event_type == "vehicle_service_alert":
        title = f"⚠️ Serwis pojazdu {vehicle_label or vin}"
        alert_type = "service_alert"
    elif event_type == "vehicle_issue_created":
        severity_emoji = "🔴" if severity == "critical" else "🟠" if severity == "high" else "🟡"
        title = f"{severity_emoji} Problem z pojazdem {vehicle_label or vin}"
        alert_type = "issue_alert"
    else:
        title = f"Alert pojazdu {vehicle_label or vin}"
        alert_type = "vehicle_alert"
    
    for admin_id in admins:
        alert = models.Notification(
            recipient_id=UUID(admin_id),
            type=alert_type,
            title=title,
            body=event_payload.get("message", "Wykryto problem z pojazdem"),
            metadata=event_payload,
            status="unread",
            action_required=severity in ("high", "critical"),
        )
        db.add(alert)
    db.commit()
