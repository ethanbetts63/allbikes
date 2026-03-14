from django.urls import path

from .views import MessageListView, MessageDetailView, MailgunWebhookView

app_name = 'notifications'

urlpatterns = [
    path('messages/', MessageListView.as_view(), name='message-list'),
    path('messages/<int:pk>/', MessageDetailView.as_view(), name='message-detail'),
    path('webhooks/mailgun/', MailgunWebhookView.as_view(), name='mailgun-webhook'),
]
