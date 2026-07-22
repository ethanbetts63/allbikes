from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..models import Booking
from ..serializers import BookingAdminSerializer


class BookingAdminViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for diary bookings.

    List supports an optional date window via `start` and `end` query params
    (inclusive, YYYY-MM-DD) so the diary can fetch just the visible week.

    A `search` param runs a basic case-insensitive text match across the
    customer, vehicle, and job fields. When present it searches across all
    dates (the `start`/`end` window is ignored) and returns the most recent
    matches first, so staff can find a booking without paging to its week.

    Bookings created here default to `accepted` / `manual` (staff are adding
    them deliberately) unless the payload overrides the status.
    """
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Booking.objects.all()

        search = (self.request.query_params.get('search') or '').strip()
        if search:
            return qs.filter(
                Q(customer_name__icontains=search)
                | Q(customer_phone__icontains=search)
                | Q(customer_email__icontains=search)
                | Q(registration__icontains=search)
                | Q(make__icontains=search)
                | Q(model__icontains=search)
                | Q(suburb__icontains=search)
                | Q(job_description__icontains=search)
            ).order_by('-drop_off_date', 'drop_off_time')

        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(drop_off_date__gte=start)
        if end:
            qs = qs.filter(drop_off_date__lte=end)
        return qs

    def perform_create(self, serializer):
        # Manual adds default to a confirmed, not-yet-started job.
        serializer.save(source=Booking.Source.MANUAL)
