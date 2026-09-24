import hashlib
import hmac
import json
import os
import time
from urllib.parse import parse_qsl

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Availability, User


load_dotenv()


BOT_TOKEN = os.getenv("BOT_TOKEN")


router = APIRouter()


# -------------------------
# Request models
# -------------------------

class TelegramAuthRequest(BaseModel):
    init_data: str

    name: str = Field(
        min_length=1,
        max_length=50,
    )

    age: int = Field(
        ge=18,
        le=100,
    )

    latitude: float | None = None
    longitude: float | None = None


class TelegramRequest(BaseModel):
    init_data: str


class ActivityItem(BaseModel):
    id: str = Field(
        min_length=1,
        max_length=50,
    )

    label: str = Field(
        min_length=1,
        max_length=100,
    )


class AvailabilityRequest(BaseModel):
    init_data: str

    activities: list[ActivityItem] = Field(
        min_length=1,
    )

    start_type: str = Field(
        min_length=1,
        max_length=20,
    )

    available_until: str = Field(
        min_length=5,
        max_length=5,
    )


# -------------------------
# Telegram validation
# -------------------------

def validate_telegram_init_data(
    init_data: str,
) -> dict:
    if not BOT_TOKEN:
        raise RuntimeError(
            "BOT_TOKEN не знайдено."
        )

    data = dict(
        parse_qsl(
            init_data,
            keep_blank_values=True,
        )
    )

    received_hash = data.pop(
        "hash",
        None,
    )

    if not received_hash:
        raise HTTPException(
            status_code=401,
            detail="Telegram hash відсутній.",
        )

    data_check_string = "\n".join(
        f"{key}={value}"
        for key, value in sorted(data.items())
    )

    secret_key = hmac.new(
        b"WebAppData",
        BOT_TOKEN.encode(),
        hashlib.sha256,
    ).digest()

    calculated_hash = hmac.new(
        secret_key,
        data_check_string.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(
        calculated_hash,
        received_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Некоректний Telegram підпис.",
        )

    auth_date_raw = data.get("auth_date")

    if not auth_date_raw:
        raise HTTPException(
            status_code=401,
            detail="auth_date відсутній.",
        )

    try:
        auth_date = int(auth_date_raw)
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Некоректний auth_date.",
        )

    max_age_seconds = 86400

    if time.time() - auth_date > max_age_seconds:
        raise HTTPException(
            status_code=401,
            detail="Telegram initData застарів.",
        )

    user_raw = data.get("user")

    if not user_raw:
        raise HTTPException(
            status_code=401,
            detail="Telegram user відсутній.",
        )

    try:
        telegram_user = json.loads(user_raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=401,
            detail="Некоректні дані Telegram user.",
        )

    if "id" not in telegram_user:
        raise HTTPException(
            status_code=401,
            detail="Telegram user ID відсутній.",
        )

    return telegram_user


def get_user_by_init_data(
    init_data: str,
    db: Session,
) -> User:
    telegram_user = validate_telegram_init_data(
        init_data
    )

    telegram_id = telegram_user["id"]

    user = db.scalar(
        select(User).where(
            User.telegram_id == telegram_id
        )
    )

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="Користувача не знайдено.",
        )

    return user


# -------------------------
# Telegram auth / profile
# -------------------------

@router.post(
    "/auth/telegram",
    tags=["auth"],
)
def telegram_auth(
    payload: TelegramAuthRequest,
    db: Session = Depends(get_db),
):
    telegram_user = validate_telegram_init_data(
        payload.init_data
    )

    telegram_id = telegram_user["id"]

    user = db.scalar(
        select(User).where(
            User.telegram_id == telegram_id
        )
    )

    if user is None:
        user = User(
            telegram_id=telegram_id,
            name=payload.name,
            age=payload.age,
            latitude=payload.latitude,
            longitude=payload.longitude,
        )

        db.add(user)

    else:
        user.name = payload.name
        user.age = payload.age
        user.latitude = payload.latitude
        user.longitude = payload.longitude

    db.commit()
    db.refresh(user)

    return {
        "status": "ok",
        "user": {
            "id": user.id,
            "telegram_id": user.telegram_id,
            "name": user.name,
            "age": user.age,
            "latitude": user.latitude,
            "longitude": user.longitude,
        },
    }


# -------------------------
# Create / update availability
# -------------------------

@router.post(
    "/availability",
    tags=["availability"],
)
def save_availability(
    payload: AvailabilityRequest,
    db: Session = Depends(get_db),
):
    user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    availability = db.scalar(
        select(Availability).where(
            Availability.user_id == user.id,
            Availability.is_active.is_(True),
        )
    )

    activities = [
        activity.model_dump()
        for activity in payload.activities
    ]

    if availability is None:
        availability = Availability(
            user_id=user.id,
            activities=activities,
            start_type=payload.start_type,
            available_until=payload.available_until,
            is_active=True,
        )

        db.add(availability)

    else:
        availability.activities = activities
        availability.start_type = (
            payload.start_type
        )
        availability.available_until = (
            payload.available_until
        )
        availability.is_active = True

    db.commit()
    db.refresh(availability)

    return {
        "status": "ok",
        "availability": {
            "id": availability.id,
            "activities": availability.activities,
            "start_type": availability.start_type,
            "available_until": (
                availability.available_until
            ),
            "is_active": availability.is_active,
        },
    }


# -------------------------
# Current availability
# -------------------------

@router.post(
    "/availability/current",
    tags=["availability"],
)
def get_current_availability(
    payload: TelegramRequest,
    db: Session = Depends(get_db),
):
    user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    availability = db.scalar(
        select(Availability)
        .where(
            Availability.user_id == user.id,
            Availability.is_active.is_(True),
        )
        .order_by(
            Availability.id.desc()
        )
    )

    if availability is None:
        return {
            "status": "ok",
            "availability": None,
        }

    return {
        "status": "ok",
        "availability": {
            "id": availability.id,
            "activities": availability.activities,
            "start_type": availability.start_type,
            "available_until": (
                availability.available_until
            ),
            "is_active": availability.is_active,
        },
    }


# -------------------------
# Stop availability
# -------------------------

@router.post(
    "/availability/stop",
    tags=["availability"],
)
def stop_availability(
    payload: TelegramRequest,
    db: Session = Depends(get_db),
):
    user = get_user_by_init_data(
        payload.init_data,
        db,
    )

    availability = db.scalar(
        select(Availability)
        .where(
            Availability.user_id == user.id,
            Availability.is_active.is_(True),
        )
        .order_by(
            Availability.id.desc()
        )
    )

    if availability is None:
        return {
            "status": "ok",
            "availability": None,
        }

    availability.is_active = False

    db.commit()

    return {
        "status": "ok",
        "availability": None,
    }
