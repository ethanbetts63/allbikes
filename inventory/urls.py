from django.urls import path
from .views import MotorcycleListView

app_name = 'inventory'

urlpatterns = [
    path('bikes/', MotorcycleListView.as_view(), name='motorcycle-list'),
]