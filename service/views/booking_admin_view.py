from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser

from ..models import Booking
from ..serializers import BookingAdminSerializer


class BookingAdminViewSet(viewsets.ModelViewSet):
    """
    Admin CRUD for diary bookings.

    List supports an optional date window via `start` and `end` query params
    (inclusive, YYYY-MM-DD) so the diary can fetch just the visible week.
    Bookings created here default to `not_started` / `manual` (staff are adding
    them deliberately) unless the payload overrides the status.
    """
    serializer_class = BookingAdminSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = Booking.objects.all()
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
