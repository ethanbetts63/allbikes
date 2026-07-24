from django.urls import path

from parts.views.catalog_views import (
    PartsModelDetailView,
    PartsModelListView,
    PartsSearchView,
    SectionDetailView,
)
from parts.views.checkout_views import (
    CreatePartsOrderView,
    CreatePartsPaymentIntentView,
    RetrievePartsOrderView,
)

app_name = "parts"

urlpatterns = [
    path("models/", PartsModelListView.as_view(), name="model-list"),
    path("models/<slug:slug>/", PartsModelDetailView.as_view(), name="model-detail"),
    path("sections/<int:pk>/", SectionDetailView.as_view(), name="section-detail"),
    path("search/", PartsSearchView.as_view(), name="search"),
    path("orders/", CreatePartsOrderView.as_view(), name="order-create"),
    path("orders/<str:order_reference>/", RetrievePartsOrderView.as_view(), name="order-detail"),
    path("create-payment-intent/", CreatePartsPaymentIntentView.as_view(), name="create-payment-intent"),
]
