from django.urls import path

from .views import MessageListView, MessageDetailView

app_name = 'notifications'

urlpatterns = [
    path('messages/', MessageListView.as_view(), name='sentmessage-list'),
    path('messages/<int:pk>/', MessageDetailView.as_view(), name='sentmessage-detail'),
]
