from datetime import timedelta

from django.utils import timezone

from ..models import BlockedDate, ServiceSettings


def compute_local_unavailable_days(in_days=30):
    """
    Build the list of unavailable day strings ('YYYY-MM-DD') from our own rules,
    used when ServiceSettings.use_mechanic_desk_blocked_dates is off.

    A day is unavailable if any of these hold:
      - it falls inside the minimum advance-notice window (booking_advance_notice)
      - its weekday is in always_blocked_weekdays
      - it has an explicit BlockedDate row

    Mirrors MechanicDesk's response shape: {"unavailable_days": [...]}.
    """
    try:
        in_days = int(in_days)
    except (TypeError, ValueError):
        in_days = 30
    in_days = max(1, min(in_days, 90))

    settings = ServiceSettings.load()
    today = timezone.localdate()
    cutoff = today + timedelta(days=settings.booking_advance_notice)
    blocked_weekdays = settings.get_always_blocked_weekdays()

    window_end = today + timedelta(days=in_days)
    explicit = set(
        BlockedDate.objects.filter(date__gte=today, date__lte=window_end)
        .values_list('date', flat=True)
    )

    unavailable = []
    for offset in range(in_days + 1):
        day = today + timedelta(days=offset)
        if day < cutoff or day.weekday() in blocked_weekdays or day in explicit:
            unavailable.append(day.isoformat())

    return {"unavailable_days": unavailable}
