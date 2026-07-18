import logging
from datetime import datetime, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import ServiceSettings
from ..utils.blocked_days import compute_local_unavailable_days_range
from .mechanics_desk_service import MechanicsDeskService

logger = logging.getLogger(__name__)


def _parse_date(value):
    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except (ValueError, TypeError):
        return None


class DiaryUnavailableDaysView(APIView):
    """
    Unavailable days for the diary, over an explicit [start, end] range.

    Mirrors the public booking form's notion of "unavailable" (advance-notice
    window, always-closed weekdays, one-off blocks, and MechanicDesk's blocked
    days while that toggle is on) so the diary greys exactly the same days.

    GET /api/service/admin/unavailable-days/?start=YYYY-MM-DD&end=YYYY-MM-DD
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        start = _parse_date(request.query_params.get('start'))
        end = _parse_date(request.query_params.get('end'))
        if not start or not end:
            return Response(
                {'error': 'start and end query params (YYYY-MM-DD) are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        settings = ServiceSettings.load()

        if not settings.use_mechanic_desk_blocked_dates:
            days = compute_local_unavailable_days_range(start, end)
            return Response({'unavailable_days': days}, status=status.HTTP_200_OK)

        # MechanicDesk source. Its API only reports days forward from today
        # (in_days, 1–90), so past/far ranges simply return nothing for those
        # portions. Never break the diary on an MD error — degrade to empty.
        today = timezone.localdate()
        in_days = (end - today).days
        if in_days < 1:
            return Response({'unavailable_days': []}, status=status.HTTP_200_OK)
        in_days = min(in_days, 90)

        md = MechanicsDeskService().get_unavailable_days(in_days=in_days)
        if not isinstance(md, dict) or 'error' in md:
            logger.warning("Diary unavailable-days: MechanicDesk error, greying nothing: %s", md)
            return Response({'unavailable_days': []}, status=status.HTTP_200_OK)

        all_days = md.get('unavailable_days', []) or []
        lo, hi = start.isoformat(), end.isoformat()
        filtered = [d for d in all_days if lo <= d <= hi]
        return Response({'unavailable_days': filtered}, status=status.HTTP_200_OK)
