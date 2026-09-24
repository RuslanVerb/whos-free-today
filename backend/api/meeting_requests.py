from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api import get_user_by_init_data
from backend.database import get_db
from backend.models import Availability, MeetingRequest, User


router = APIRouter(
    prefix="/requests",
    tags=["meeting requests"],
)


class CreateMeetingRequest(BaseModel):
    init_data: str

    receiver_id: int = Field(
        ge=1,
    )


@router.post("")
def create_meeting_request(
    payload: CreateMeetingRequest,
    db: Session = Depends(get_db),
):
    sender = get_user_by_init_data(
        payload.init_data,
        db,
    )

    if sender.id == payload.receiver_id:
        raise HTTPException(
            status_code=400,
            detail="Не можна надіслати запит самому собі.",
        )

    receiver = db.scalar(
        select(User).where(
            User.id == payload.receiver_id
        )
    )

    if receiver is None:
        raise HTTPException(
            status_code=404,
            detail="Користувача не знайдено.",
        )

    now = datetime.now(
        timezone.utc
    )

    receiver_availability = db.scalar(
        select(Availability)
        .where(
            Availability.user_id == receiver.id,
            Availability.is_active.is_(True),
            Availability.starts_at.is_not(None),
            Availability.expires_at.is_not(None),
            Availability.starts_at <= now,
            Availability.expires_at > now,
        )
        .order_by(
            Availability.id.desc()
        )
    )

    if receiver_availability is None:
        raise HTTPException(
            status_code=409,
            detail="Користувач уже не доступний для зустрічі.",
        )

    existing_request = db.scalar(
        select(MeetingRequest)
        .where(
            MeetingRequest.sender_id == sender.id,
            MeetingRequest.receiver_id == receiver.id,
            MeetingRequest.status == "pending",
        )
        .order_by(
            MeetingRequest.id.desc()
        )
    )

    if existing_request is not None:
        return {
            "status": "already_pending",
            "request": {
                "id": existing_request.id,
                "receiver_id": receiver.id,
                "receiver_name": receiver.name,
                "request_status": existing_request.status,
            },
        }

    meeting_request = MeetingRequest(
        sender_id=sender.id,
        receiver_id=receiver.id,
        status="pending",
    )

    db.add(meeting_request)
    db.commit()
    db.refresh(meeting_request)

    return {
        "status": "ok",
        "request": {
            "id": meeting_request.id,
            "receiver_id": receiver.id,
            "receiver_name": receiver.name,
            "request_status": meeting_request.status,
        },
    }
