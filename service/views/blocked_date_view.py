from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from ..models import BlockedDate
from ..serializers import BlockedDateSerializer


class BlockedDateViewSet(viewsets.ModelViewSet):
    """
    Admin management of one-off blocked days.

    Supports an optional `start`/`end` date window on list. Also exposes an
    `unblock` action so the diary can clear an override by date (rather than id)
    when a staff member resets a day to its default.

    A day override goes in either direction via `available`:
      - available=False → force the day closed.
      - available=True  → force the day open, beating the recurring rules
        (advance notice / always-closed weekdays).
    Since `date` is unique, POSTing the same date upserts the single row, so a
    day can flip between block and force-open without deleting first.
    """
    serializer_class = BlockedDateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = BlockedDate.objects.all()
        start = self.request.query_params.get('start')
        end = self.request.query_params.get('end')
        if start:
            qs = qs.filter(date__gte=start)
        if end:
            qs = qs.filter(date__lte=end)
        return qs

    def create(self, request, *args, **kwargs):
        # Upsert on date: flipping a day between blocked and force-open just
        # updates the single row rather than colliding with the unique date.
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        obj, created = BlockedDate.objects.update_or_create(
            date=data['date'],
            defaults={
                'available': data.get('available', False),
                'reason': data.get('reason', ''),
            },
        )
        out = self.get_serializer(obj)
        code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(out.data, status=code)

    @action(detail=False, methods=['post'])
    def unblock(self, request):
        # Clears any override (block or force-open) for the date, returning it
        # to the default rules.
        date = request.data.get('date')
        deleted, _ = BlockedDate.objects.filter(date=date).delete()
        return Response({'deleted': deleted}, status=status.HTTP_200_OK)
