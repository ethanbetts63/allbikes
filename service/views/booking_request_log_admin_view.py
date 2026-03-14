from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAdminUser

from ..models import BookingRequestLog
from ..serializers import BookingRequestLogListSerializer, BookingRequestLogDetailSerializer


class BookingRequestLogListView(ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = BookingRequestLogListSerializer

    def get_queryset(self):
        qs = BookingRequestLog.objects.all()
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        return qs


class BookingRequestLogDetailView(RetrieveAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = BookingRequestLogDetailSerializer
    queryset = BookingRequestLog.objects.all()
