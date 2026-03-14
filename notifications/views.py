from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import SentMessage
from notifications.serializers import SentMessageListSerializer, SentMessageDetailSerializer


class SentMessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class SentMessageListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        messages = SentMessage.objects.all()
        if channel := request.query_params.get('channel'):
            messages = messages.filter(channel=channel)
        if status := request.query_params.get('status'):
            messages = messages.filter(status=status)
        if message_type := request.query_params.get('message_type'):
            messages = messages.filter(message_type=message_type)
        paginator = SentMessagePagination()
        page = paginator.paginate_queryset(messages, request)
        return paginator.get_paginated_response(SentMessageListSerializer(page, many=True).data)


class SentMessageDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            message = SentMessage.objects.get(pk=pk)
        except SentMessage.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(SentMessageDetailSerializer(message).data)
