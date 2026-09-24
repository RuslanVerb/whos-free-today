from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.api import get_user_by_init_data
from backend.database import get_db
from backend.models import Availability, MeetingRequest, User

from datetime import datetime, timezone


router = APIRouter(
    prefix="/requests",
    tags=["meeting requests"],
)


# -------------------------
# Request models
# -------------------------

class TelegramRequest(BaseModel):
    init_data: str


class CreateMeetingRequest(BaseModel):
    init_data: str

    receiver_id: int = Field(
        ge=1,
    )


class MeetingRequestAction(BaseModel):
    init_data: str


# -------------------------
# Create meeting request
# -------------------------

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


# -------------------------
# Incoming requests
# -------------------------

@router.post("/incoming")
def get_incoming_requests(
    payload: TelegramRequest,
    db: Session = Depends(get_db),
):
    current_user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    rows = db.execute(
        select(
            MeetingRequest,
            User,
        )
        .join(
            User,
            User.id == MeetingRequest.sender_id,
        )
        .where(
            MeetingRequest.receiver_id == current_user.id,
            MeetingRequest.status == "pending",
        )
        .order_by(
            MeetingRequest.id.desc()
        )
    ).all()

    requests = []

    for meeting_request, sender in rows:
        requests.append(
            {
                "id": meeting_request.id,
                "sender": {
                    "id": sender.id,
                    "name": sender.name,
                    "age": sender.age,
                },
                "status": meeting_request.status,
                "created_at": (
                    meeting_request.created_at.isoformat()
                    if meeting_request.created_at
                    else None
                ),
            }
        )

    return {
        "status": "ok",
        "count": len(requests),
        "requests": requests,
    }


# -------------------------
# Accept request
# -------------------------

@router.post("/{request_id}/accept")
def accept_meeting_request(
    request_id: int,
    payload: MeetingRequestAction,
    db: Session = Depends(get_db),
):
    current_user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    meeting_request = db.scalar(
        select(MeetingRequest).where(
            MeetingRequest.id == request_id
        )
    )

    if meeting_request is None:
        raise HTTPException(
            status_code=404,
            detail="Запит не знайдено.",
        )

    if meeting_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Цей запит адресований іншому користувачу.",
        )

    if meeting_request.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="На цей запит уже відповіли.",
        )

    meeting_request.status = "accepted"

    db.commit()
    db.refresh(meeting_request)

    return {
        "status": "ok",
        "request": {
            "id": meeting_request.id,
            "request_status": meeting_request.status,
            "sender_id": meeting_request.sender_id,
            "receiver_id": meeting_request.receiver_id,
        },
    }


# -------------------------
# Reject request
# -------------------------

@router.post("/{request_id}/reject")
def reject_meeting_request(
    request_id: int,
    payload: MeetingRequestAction,
    db: Session = Depends(get_db),
):
    current_user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    meeting_request = db.scalar(
        select(MeetingRequest).where(
            MeetingRequest.id == request_id
        )
    )

    if meeting_request is None:
        raise HTTPException(
            status_code=404,
            detail="Запит не знайдено.",
        )

    if meeting_request.receiver_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Цей запит адресований іншому користувачу.",
        )

    if meeting_request.status != "pending":
        raise HTTPException(
            status_code=409,
            detail="На цей запит уже відповіли.",
        )

    meeting_request.status = "rejected"

    db.commit()
    db.refresh(meeting_request)

    return {
        "status": "ok",
        "request": {
            "id": meeting_request.id,
            "request_status": meeting_request.status,
        },
    }
