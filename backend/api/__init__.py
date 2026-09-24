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
from backend.models import User


load_dotenv()


BOT_TOKEN = os.getenv("BOT_TOKEN")


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


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


@router.post("/telegram")
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
