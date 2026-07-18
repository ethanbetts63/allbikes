from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from datetime import datetime
import logging

from .mechanics_desk_service import MechanicsDeskService
from ..serializers import BookingSerializer, ServiceSettingsSerializer
from ..models import ServiceSettings, BookingRequestLog, JobType, Booking
from ..utils.blocked_days import compute_local_unavailable_days
from notifications.utils.email import send_admin_service_booking, send_service_booking_confirmation

logger = logging.getLogger(__name__)


def _create_local_booking(validated_data, booking_log):
    """
    Persist a local diary Booking alongside the MechanicDesk request.

    Website submissions land as `requested` (staff confirm them on the diary).
    Never raises — a local-persist failure must not break the customer's
    booking, which has already succeeded in MechanicDesk.
    """
    try:
        drop_off_raw = validated_data.get('drop_off_time', '')
        drop_off_date = None
        drop_off_time = None
        try:
            parsed = datetime.strptime(drop_off_raw, '%d/%m/%Y %H:%M')
            drop_off_date = parsed.date()
            drop_off_time = parsed.time()
        except (ValueError, TypeError):
            logger.warning("Could not parse drop_off_time '%s' for local booking", drop_off_raw)

        if drop_off_date is None:
            # Without a date there is nowhere to place the tile; skip local record.
            logger.warning("Skipping local booking creation: no parseable drop-off date")
            return None

        job_names = validated_data.get('job_type_names', [])
        make = validated_data.get('make', '')
        model = validated_data.get('model', '')

        return Booking.objects.create(
            drop_off_date=drop_off_date,
            drop_off_time=drop_off_time,
            customer_name=validated_data.get('name') or f"{validated_data.get('first_name', '')} {validated_data.get('last_name', '')}".strip(),
            customer_phone=validated_data.get('phone', ''),
            customer_email=validated_data.get('email', ''),
            bike_name=f"{make} {model}".strip(),
            registration=validated_data.get('registration_number', ''),
            job_description=', '.join(job_names) if job_names else '',
            status=Booking.Status.REQUESTED,
            source=Booking.Source.WEBSITE,
            booking_log=booking_log,
        )
    except Exception:
        logger.exception("Failed to create local diary booking; continuing")
        return None

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
        if not request.data.get('terms_accepted'):
            return Response({'error': 'You must accept the terms and conditions.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = BookingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated_data = serializer.validated_data

        # Prepend drop-off time to the note field
        drop_off_time = validated_data.get('drop_off_time')
        existing_note = validated_data.get('note', '')

        prefix = f"Preferred drop-off time: {drop_off_time}"

        if existing_note:
            validated_data['note'] = f"{prefix}\n\n{existing_note}"
        else:
            validated_data['note'] = prefix

        log_payload = {
            'customer_name': validated_data.get('name'),
            'customer_email': validated_data.get('email'),
            'vehicle_registration': validated_data.get('registration_number'),
            'request_payload': validated_data,
        }

        try:
            service = MechanicsDeskService()
            logger.info("Sending service booking to MechanicsDesk")
            response_data = service.create_booking(booking_data=validated_data)
            logger.info("MechanicsDesk service booking response=%s", response_data)

            log_payload['response_body'] = response_data
            if "error" in response_data or (isinstance(response_data, dict) and response_data.get('status') == 'error'):
                log_payload['status'] = 'Failed'
                log_payload['response_status_code'] = 500
                booking_log = BookingRequestLog.objects.create(**log_payload)
                logger.warning("MechanicsDesk booking failed; booking_log_id=%s; skipping emails", booking_log.pk)
                return Response(response_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            log_payload['status'] = 'Success'
            log_payload['response_status_code'] = 200
            booking_log = BookingRequestLog.objects.create(**log_payload)
            logger.info("Service booking log id=%s created; sending emails", booking_log.pk)

            # Dual-write: also persist a local diary booking (status 'requested').
            local_booking = _create_local_booking(validated_data, booking_log)
            if local_booking:
                logger.info("Local diary booking id=%s created", local_booking.pk)

            send_service_booking_confirmation(validated_data, booking_log)
            send_admin_service_booking(validated_data, booking_log)
            logger.info("Service booking email calls finished booking_log_id=%s", booking_log.pk)

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            error_message = str(e)
            logger.exception("Unexpected service booking error")
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

        # The service returns a list of job type names, e.g., ['Type 1', 'Type 2']
        if not isinstance(mechanicdesk_data, list):
            # Handle potential error responses which are dicts
            if isinstance(mechanicdesk_data, dict) and 'error' in mechanicdesk_data:
                return Response(mechanicdesk_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            # Or if the format is just wrong for some other reason
            return Response({'error': 'Unexpected data format from external service.'},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        job_type_names = mechanicdesk_data

        
        # Get local descriptions
        local_job_types = JobType.objects.all()
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
        Fetches the list of unavailable days.

        Sourced from MechanicDesk while use_mechanic_desk_blocked_dates is on;
        computed from our own rules/blocked dates once it is switched off.
        Maps to GET /api/service/booking/unavailable_days/
        """
        in_days = request.query_params.get('in_days', 30)

        settings = ServiceSettings.load()
        if not settings.use_mechanic_desk_blocked_dates:
            return Response(compute_local_unavailable_days(in_days=in_days), status=status.HTTP_200_OK)

        service = MechanicsDeskService()
        unavailable_days = service.get_unavailable_days(in_days=in_days)
        if "error" in unavailable_days:
            return Response(unavailable_days, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(unavailable_days, status=status.HTTP_200_OK)
