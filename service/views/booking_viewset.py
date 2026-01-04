from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .mechanics_desk_service import MechanicsDeskService
from ..serializers import BookingSerializer, ServiceSettingsSerializer
from ..models import ServiceSettings, BookingRequestLog, JobType


class BookingViewSet(viewsets.ViewSet):
    """
    A ViewSet for handling booking-related actions.
    - list/create bookings
    - retrieve job types
    - retrieve unavailable days
    - retrieve service settings
    """
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        """
        Creates a new booking request.
        Validates incoming data, sends it to MechanicsDesk, and logs the transaction.
        Maps to POST /api/service/booking/
        """
        serializer = BookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        log_payload = {
            'customer_name': validated_data.get('name'),
            'customer_email': validated_data.get('email'),
            'vehicle_registration': validated_data.get('registration_number'),
            'request_payload': validated_data,
        }

        try:
            service = MechanicsDeskService()
            response_data = service.create_booking(booking_data=validated_data)

            log_payload['response_body'] = response_data
            if "error" in response_data or (isinstance(response_data, dict) and response_data.get('status') == 'error'):
                log_payload['status'] = 'Failed'
                log_payload['response_status_code'] = 500
                BookingRequestLog.objects.create(**log_payload)
                return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            log_payload['status'] = 'Success'
            log_payload['response_status_code'] = 200
            BookingRequestLog.objects.create(**log_payload)

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_message = str(e)
            log_payload['status'] = 'Failed'
            log_payload['response_status_code'] = 500
            log_payload['response_body'] = {'error': 'An unexpected error occurred.', 'details': error_message}
            BookingRequestLog.objects.create(**log_payload)
            return Response(log_payload['response_body'], status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def fetch_service_config(self, request):
        """
        Fetches the service settings.
        Maps to GET /api/service/settings/
        """
        settings = ServiceSettings.objects.first()
        if not settings:
            return Response({"error": "Service settings not configured."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ServiceSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def job_types(self, request):
        """
        Fetches the list of available job types from MechanicsDesk and enriches
        them with descriptions from the local database.
        """
        service = MechanicsDeskService()
        mechanicdesk_data = service.get_job_types()

        # The service returns a dict, e.g., {'job_type_names': ['Type 1', 'Type 2']}
        job_type_names = mechanicdesk_data.get('job_type_names', [])
        if "error" in job_type_names:
            return Response(job_type_names, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Get local descriptions
        local_job_types = JobType.objects.filter(is_active=True)
        descriptions = {jt.name.lower().strip(): jt.description for jt in local_job_types}

        # Combine the data
        enriched_job_types = []
        for name in job_type_names:
            enriched_job_types.append({
                'name': name,
                'description': descriptions.get(name.lower().strip(), None)
            })

        return Response(enriched_job_types, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def unavailable_days(self, request):
        """
        Fetches the list of unavailable days from MechanicsDesk.
        Maps to GET /api/service/booking/unavailable_days/
        """
        service = MechanicsDeskService()
        in_days = request.query_params.get('in_days', 30)
        unavailable_days = service.get_unavailable_days(in_days=in_days)
        if "error" in unavailable_days:
            return Response(unavailable_days, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(unavailable_days, status=status.HTTP_200_OK)
