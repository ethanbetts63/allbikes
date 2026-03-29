from datetime import date, timedelta

from ..models import HireBooking, HireBlockedDate


def get_unavailable_motorcycle_ids(start_date: date, end_date: date, gap_days: int = 0):
    """
    Return the IDs of motorcycles unavailable for the given date range, including:
    - Bikes with a confirmed/active/returned booking overlapping the range (+ gap buffer)
    - Bikes with a bike-specific blocked date overlapping the range
    """
    booked_ids = HireBooking.objects.filter(
        hire_start__lte=end_date + timedelta(days=gap_days),
        hire_end__gte=start_date - timedelta(days=gap_days),
        status__in=['confirmed', 'active', 'returned'],
    ).values_list('motorcycle_id', flat=True)

    blocked_ids = HireBlockedDate.objects.filter(
        date_from__lte=end_date,
        date_to__gte=start_date,
        motorcycle__isnull=False,
    ).values_list('motorcycle_id', flat=True)

    return set(list(booked_ids) + list(blocked_ids))


def is_motorcycle_available(motorcycle_id: int, start_date: date, end_date: date, gap_days: int = 0) -> bool:
    """
    Return True if the motorcycle is available for the given date range.
    Checks bookings, bike-specific blocks, and global blocks.
    """
    if is_globally_blocked(start_date, end_date):
        return False
    return motorcycle_id not in get_unavailable_motorcycle_ids(start_date, end_date, gap_days)


def is_globally_blocked(start_date: date, end_date: date) -> bool:
    """
    Return True if the date range overlaps any global blocked date (shop closure etc).
    """
    return HireBlockedDate.objects.filter(
        date_from__lte=end_date,
        date_to__gte=start_date,
        motorcycle__isnull=True,
    ).exists()
