from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination

from ..models import HireBooking
from ..serializers import HireBookingSerializer, HireBookingStatusSerializer


class HireBookingPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class AdminHireBookingListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        status_filter = request.query_params.get('status')
        bookings = HireBooking.objects.select_related('motorcycle').order_by('-created_at')
        if status_filter:
            statuses = [s.strip() for s in status_filter.split(',')]
            bookings = bookings.filter(status__in=statuses)
        paginator = HireBookingPagination()
        page = paginator.paginate_queryset(bookings, request)
        return paginator.get_paginated_response(HireBookingSerializer(page, many=True).data)


class AdminHireBookingDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            booking = HireBooking.objects.select_related('motorcycle').get(pk=pk)
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Hire booking not found.'}, status=404)
        return Response(HireBookingSerializer(booking).data)


class AdminHireBookingStatusView(APIView):
    permission_classes = [IsAdminUser]

    def patch(self, request, pk):
        try:
            booking = HireBooking.objects.get(pk=pk)
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Hire booking not found.'}, status=404)
        serializer = HireBookingStatusSerializer(booking, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)
        serializer.save()
        return Response(HireBookingSerializer(booking).data)
