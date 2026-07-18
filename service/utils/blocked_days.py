from datetime import timedelta

from django.utils import timezone

from ..models import BlockedDate, ServiceSettings


def compute_local_unavailable_days_range(start, end):
    """
    List unavailable day strings ('YYYY-MM-DD') in the inclusive [start, end]
    range, from our own rules. Used when ServiceSettings.use_mechanic_desk_blocked_dates
    is off.

    A day is unavailable if any of these hold:
      - it falls inside the minimum advance-notice window (booking_advance_notice,
        measured from today)
      - its weekday is in always_blocked_weekdays
      - it has an explicit BlockedDate row
    """
    if end < start:
        return []

    settings = ServiceSettings.load()
    today = timezone.localdate()
    cutoff = today + timedelta(days=settings.booking_advance_notice)
    blocked_weekdays = settings.get_always_blocked_weekdays()

    explicit = set(
        BlockedDate.objects.filter(date__gte=start, date__lte=end)
        .values_list('date', flat=True)
    )

    unavailable = []
    day = start
    while day <= end:
        if day < cutoff or day.weekday() in blocked_weekdays or day in explicit:
            unavailable.append(day.isoformat())
        day += timedelta(days=1)
    return unavailable


def compute_local_unavailable_days(in_days=30):
    """
    Public-form helper: unavailable days from today for the next `in_days`
    (clamped 1–90). Mirrors MechanicDesk's response shape: {"unavailable_days": [...]}.
    """
    try:
        in_days = int(in_days)
    except (TypeError, ValueError):
        in_days = 30
    in_days = max(1, min(in_days, 90))

    today = timezone.localdate()
    days = compute_local_unavailable_days_range(today, today + timedelta(days=in_days))
    return {"unavailable_days": days}
