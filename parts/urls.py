from django.urls import path

from parts.views.catalog_views import (
    PartsModelDetailView,
    PartsModelListView,
    PartsSearchView,
    VinLookupView,
    ModelSectionDetailView,
    SectionDetailView,
)
from parts.views.checkout_views import (
    CreatePartsOrderView,
    CreatePartsPaymentIntentView,
    RetrievePartsOrderConfirmationView,
    RetrievePartsOrderView,
)
from parts.views.admin_order_views import (
    AdminPartsOrderDetailView,
    AdminPartsOrderItemView,
    AdminPartsOrderListView,
    AdminPartsSupplierEmailView,
    AdminPartsCustomerUpdateView,
)
from parts.views.settings_views import AdminPartsSettingsView

app_name = "parts"

urlpatterns = [
    path("models/", PartsModelListView.as_view(), name="model-list"),
    path("models/<slug:slug>/", PartsModelDetailView.as_view(), name="model-detail"),
    path("models/<slug:slug>/sections/<str:code>/", ModelSectionDetailView.as_view(), name="model-section-detail"),
    path("sections/<int:pk>/", SectionDetailView.as_view(), name="section-detail"),
    path("search/", PartsSearchView.as_view(), name="search"),
    path("vin-lookup/", VinLookupView.as_view(), name="vin-lookup"),
    path("orders/", CreatePartsOrderView.as_view(), name="order-create"),
    path("orders/<str:order_reference>/confirmation/", RetrievePartsOrderConfirmationView.as_view(), name="order-confirmation"),
    path("create-payment-intent/", CreatePartsPaymentIntentView.as_view(), name="create-payment-intent"),
    # Admin (IsAdminUser)
    path("admin/orders/", AdminPartsOrderListView.as_view(), name="admin-order-list"),
    path("admin/settings/", AdminPartsSettingsView.as_view(), name="admin-settings"),
    path("admin/orders/<str:order_reference>/", AdminPartsOrderDetailView.as_view(), name="admin-order-detail"),
    path("admin/orders/<str:order_reference>/supplier-email/", AdminPartsSupplierEmailView.as_view(), name="admin-order-supplier-email"),
    path("admin/orders/<str:order_reference>/customer-update/", AdminPartsCustomerUpdateView.as_view(), name="admin-order-customer-update"),
    path("admin/items/<int:pk>/", AdminPartsOrderItemView.as_view(), name="admin-order-item"),
    # Public order retrieval by reference — keep last so it doesn't shadow admin/.
    path("orders/<str:order_reference>/", RetrievePartsOrderView.as_view(), name="order-detail"),
]
