from django.urls import path

from .views import SentMessageListView, SentMessageDetailView

urlpatterns = [
    path('messages/', SentMessageListView.as_view()),
    path('messages/<int:pk>/', SentMessageDetailView.as_view()),
]
