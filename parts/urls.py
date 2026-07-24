from django.urls import path

from parts.views.catalog_views import (
    PartsModelDetailView,
    PartsModelListView,
    PartsSearchView,
    SectionDetailView,
)

app_name = "parts"

urlpatterns = [
    path("models/", PartsModelListView.as_view(), name="model-list"),
    path("models/<slug:slug>/", PartsModelDetailView.as_view(), name="model-detail"),
    path("sections/<int:pk>/", SectionDetailView.as_view(), name="section-detail"),
    path("search/", PartsSearchView.as_view(), name="search"),
]
