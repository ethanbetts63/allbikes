from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .mechanics_desk_service import MechanicsDeskService
from ..serializers import BookingSerializer
from ..models import ServiceSettings, BookingRequestLog

class GetJobTypesView(APIView):
    """
    An API view to fetch the list of available job types from MechanicsDesk.
    """
    def get(self, request, *args, **kwargs):
        service = MechanicsDeskService()
        job_types = service.get_job_types()
        if "error" in job_types:
            return Response(job_types, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(job_types, status=status.HTTP_200_OK)


class GetUnavailableDaysView(APIView):
    """
    An API view to fetch the list of unavailable days from MechanicsDesk.
    """
    def get(self, request, *args, **kwargs):
        service = MechanicsDeskService()
        # Optional: allow passing 'in_days' as a query parameter
        in_days = request.query_params.get('in_days', 30)
        unavailable_days = service.get_unavailable_days(in_days=in_days)
        if "error" in unavailable_days:
            return Response(unavailable_days, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(unavailable_days, status=status.HTTP_200_OK)


class CreateBookingView(APIView):
    """
    An API view to create a new booking request.
    It validates the incoming data, combines it with internal settings,
    sends it to MechanicsDesk, and logs the transaction.
    """
    def post(self, request, *args, **kwargs):
        serializer = BookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data
        
        # --- Logging Payload ---
        log_payload = {
            'customer_name': validated_data.get('name'),
            'customer_email': validated_data.get('email'),
            'vehicle_registration': validated_data.get('registration_number'),
            'request_payload': validated_data,
        }

        try:
            # --- Call MechanicsDesk Service ---
            service = MechanicsDeskService()
            response_data = service.create_booking(booking_data=validated_data)
            
            # --- Log the response ---
            log_payload['response_body'] = response_data
            if "error" in response_data or (isinstance(response_data, dict) and response_data.get('status') == 'error'):
                log_payload['status'] = 'Failed'
                log_payload['response_status_code'] = 500 # Assuming failure
                BookingRequestLog.objects.create(**log_payload)
                return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            log_payload['status'] = 'Success'
            log_payload['response_status_code'] = 200 # Assuming success
            BookingRequestLog.objects.create(**log_payload)
            
            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # --- Log unexpected errors ---
            error_message = str(e)
            log_payload['status'] = 'Failed'
            log_payload['response_status_code'] = 500
            log_payload['response_body'] = {'error': 'An unexpected error occurred.', 'details': error_message}
            BookingRequestLog.objects.create(**log_payload)
            return Response(log_payload['response_body'], status=status.HTTP_500_INTERNAL_SERVER_ERROR)

