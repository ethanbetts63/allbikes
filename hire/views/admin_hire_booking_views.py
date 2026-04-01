import re
from pathlib import Path

from io import BytesIO

from django.http import HttpResponse
from django.template.loader import render_to_string
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.pagination import PageNumberPagination
from xhtml2pdf import pisa

from ..models import HireBooking
from ..serializers import HireBookingSerializer, HireBookingStatusSerializer

_TERMS_PATH = Path(__file__).resolve().parents[2] / 'data_management' / 'data' / 'terms_hire.html'


def _get_terms_html():
    html = _TERMS_PATH.read_text(encoding='utf-8')
    match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL | re.IGNORECASE)
    return match.group(1).strip() if match else html


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

    def delete(self, request, pk):
        try:
            booking = HireBooking.objects.get(pk=pk)
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Hire booking not found.'}, status=404)
        booking.delete()
        return Response(status=204)


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


class AdminHireBookingContractView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            booking = HireBooking.objects.select_related('motorcycle').prefetch_related('extras__extra').get(pk=pk)
        except HireBooking.DoesNotExist:
            return Response({'detail': 'Hire booking not found.'}, status=404)
        html = render_to_string('hire/contract.html', {
            'booking': booking,
            'terms_html': _get_terms_html(),
        })
        buf = BytesIO()
        pisa.CreatePDF(html, dest=buf)
        response = HttpResponse(buf.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{booking.booking_reference}_contract.pdf"'
        return response
