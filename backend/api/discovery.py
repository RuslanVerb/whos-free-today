from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from backend.api import get_user_by_init_data
from backend.database import get_db
from backend.models import Availability, User
from backend.services.discovery import calculate_distance_km


router = APIRouter(
    prefix="/discovery",
    tags=["discovery"],
)


class DiscoveryRequest(BaseModel):
    init_data: str

    radius_km: float = Field(
        default=25,
        ge=1,
        le=100,
    )

    activity: str | None = None


@router.post("")
def discovery(
    payload: DiscoveryRequest,
    db: Session = Depends(get_db),
):
    current_user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    if (
        current_user.latitude is None
        or current_user.longitude is None
    ):
        return {
            "status": "ok",
            "people": [],
            "message": "Локація користувача відсутня.",
        }

    now = datetime.now(
        timezone.utc
    )

    # Automatically disable expired statuses.
    db.execute(
        update(Availability)
        .where(
            Availability.is_active.is_(True),
            Availability.expires_at.is_not(None),
            Availability.expires_at <= now,
        )
        .values(
            is_active=False
        )
    )

    db.commit()

    rows = db.execute(
        select(
            User,
            Availability,
        )
        .join(
            Availability,
            Availability.user_id == User.id,
        )
        .where(
            User.id != current_user.id,

            User.latitude.is_not(None),
            User.longitude.is_not(None),

            Availability.is_active.is_(True),

            Availability.starts_at.is_not(None),
            Availability.expires_at.is_not(None),

            Availability.starts_at <= now,
            Availability.expires_at > now,
        )
    ).all()

    people = []

    for user, availability in rows:
        if payload.activity:
            activity_ids = [
                item.get("id")
                for item in availability.activities
            ]

            if payload.activity not in activity_ids:
                continue

        distance_km = calculate_distance_km(
            current_user.latitude,
            current_user.longitude,
            user.latitude,
            user.longitude,
        )

        if distance_km > payload.radius_km:
            continue

        people.append(
            {
                "user_id": user.id,
                "name": user.name,
                "age": user.age,

                "distance_km": round(
                    distance_km,
                    1,
                ),

                "activities":
                    availability.activities,

                "available_until":
                    availability.available_until,
            }
        )

    people.sort(
        key=lambda person:
            person["distance_km"]
    )

    return {
        "status": "ok",
        "radius_km": payload.radius_km,
        "activity": payload.activity,
        "count": len(people),
        "people": people,
    }
