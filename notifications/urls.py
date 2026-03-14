from django.urls import path

from .views import SentMessageListView, SentMessageDetailView

app_name = 'notifications'

urlpatterns = [
    path('messages/', SentMessageListView.as_view(), name='sentmessage-list'),
    path('messages/<int:pk>/', SentMessageDetailView.as_view(), name='sentmessage-detail'),
]
