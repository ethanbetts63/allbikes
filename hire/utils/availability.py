from datetime import date

from ..models import HireBooking


def get_unavailable_motorcycle_ids(start_date: date, end_date: date):
    """
    Return the IDs of motorcycles that have a non-cancelled booking
    overlapping the given date range.
    """
    return HireBooking.objects.filter(
        hire_start__lte=end_date,
        hire_end__gte=start_date,
    ).exclude(status='cancelled').values_list('motorcycle_id', flat=True)


def is_motorcycle_available(motorcycle_id: int, start_date: date, end_date: date) -> bool:
    """
    Return True if the motorcycle has no non-cancelled booking overlapping
    the given date range.
    """
    return not HireBooking.objects.filter(
        motorcycle_id=motorcycle_id,
        hire_start__lte=end_date,
        hire_end__gte=start_date,
    ).exclude(status='cancelled').exists()
