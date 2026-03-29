from datetime import date, timedelta

from ..models import HireBooking


def get_unavailable_motorcycle_ids(start_date: date, end_date: date, gap_days: int = 0):
    """
    Return the IDs of motorcycles that have a non-cancelled booking
    overlapping the given date range, including the gap buffer on either side.
    """
    return HireBooking.objects.filter(
        hire_start__lte=end_date + timedelta(days=gap_days),
        hire_end__gte=start_date - timedelta(days=gap_days),
        status__in=['confirmed', 'active', 'returned'],
    ).values_list('motorcycle_id', flat=True)


def is_motorcycle_available(motorcycle_id: int, start_date: date, end_date: date, gap_days: int = 0) -> bool:
    """
    Return True if the motorcycle has no confirmed/active/returned booking
    overlapping the given date range (including gap buffer).
    """
    return motorcycle_id not in get_unavailable_motorcycle_ids(start_date, end_date, gap_days)
