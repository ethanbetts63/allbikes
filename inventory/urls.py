from django.urls import path
from .views import MotorcycleListView, MotorcycleDetailView

app_name = 'inventory'

urlpatterns = [
    path('bikes/', MotorcycleListView.as_view(), name='motorcycle-list'),
    path('bikes/<int:pk>/', MotorcycleDetailView.as_view(), name='motorcycle-detail'),
]