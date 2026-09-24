from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError


VALID_START_TYPES = {
    "now",
    "hour",
    "evening",
}


def calculate_availability_window(
    start_type: str,
    available_until: str,
    timezone_name: str,
) -> tuple[datetime, datetime]:
    if start_type not in VALID_START_TYPES:
        raise ValueError(
            "Некоректний тип часу початку."
        )

    try:
        user_timezone = ZoneInfo(
            timezone_name
        )
    except ZoneInfoNotFoundError:
        raise ValueError(
            "Некоректний часовий пояс."
        )

    now = datetime.now(
        user_timezone
    )

    if start_type == "now":
        starts_at = now

    elif start_type == "hour":
        starts_at = (
            now +
            timedelta(hours=1)
        )

    else:
        evening_start = now.replace(
            hour=18,
            minute=0,
            second=0,
            microsecond=0,
        )

        if now >= evening_start:
            starts_at = now
        else:
            starts_at = evening_start

    try:
        until_time = datetime.strptime(
            available_until,
            "%H:%M",
        ).time()

    except ValueError:
        raise ValueError(
            "Некоректний час завершення."
        )

    expires_at = datetime.combine(
        now.date(),
        until_time,
        tzinfo=user_timezone,
    )

    if expires_at <= starts_at:
        raise ValueError(
            "Час завершення має бути "
            "пізніше часу початку."
        )

    return (
        starts_at.astimezone(
            timezone.utc
        ),
        expires_at.astimezone(
            timezone.utc
        ),
    )
