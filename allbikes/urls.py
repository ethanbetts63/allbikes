from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseGone
from data_management.views.token_views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CookieLogoutView,
)

urlpatterns = []

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

urlpatterns += [
    path("admin/", admin.site.urls),
    
    # API endpoints
    path("api/data/", include("data_management.urls")),
    path("api/service/", include("service.urls")),
    path("api/inventory/", include("inventory.urls")),
    path("api/product/", include("product.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/hire/", include("hire.urls")),
    path("api/notifications/", include("notifications.urls")),

    # JWT Token Authentication Endpoints
    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/logout/', CookieLogoutView.as_view(), name='token_logout'),
    
    # Legacy URLs that no longer exist
    path('_mycart', lambda request: HttpResponseGone()),
]
