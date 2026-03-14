from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import Message
from notifications.serializers import MessageListSerializer, MessageDetailSerializer


class MessagePagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class MessageListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        messages = Message.objects.all()
        if channel := request.query_params.get('channel'):
            messages = messages.filter(channel=channel)
        if status := request.query_params.get('status'):
            messages = messages.filter(status=status)
        if message_type := request.query_params.get('message_type'):
            messages = messages.filter(message_type=message_type)
        paginator = MessagePagination()
        page = paginator.paginate_queryset(messages, request)
        return paginator.get_paginated_response(MessageListSerializer(page, many=True).data)


class MessageDetailView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        try:
            message = Message.objects.get(pk=pk)
        except Message.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=404)
        return Response(MessageDetailSerializer(message).data)
