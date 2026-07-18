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
    `unblock` action so the diary can remove a block by date (rather than id)
    when a staff member clicks a blocked day and chooses "unblock".
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
        # Blocking an already-blocked day is idempotent — return the existing row.
        date = request.data.get('date')
        existing = BlockedDate.objects.filter(date=date).first()
        if existing:
            serializer = self.get_serializer(existing)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def unblock(self, request):
        date = request.data.get('date')
        deleted, _ = BlockedDate.objects.filter(date=date).delete()
        return Response({'deleted': deleted}, status=status.HTTP_200_OK)
