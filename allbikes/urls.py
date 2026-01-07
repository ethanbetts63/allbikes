from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.contrib.sitemaps.views import sitemap
from .sitemaps import MotorcycleSitemap, StaticViewSitemap

sitemaps = {
    'motorcycles': MotorcycleSitemap,
    'static': StaticViewSitemap,
}

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

    # Sitemap
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),

    # JWT Token Authentication Endpoints
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Catch-all for the React frontend
    re_path(r'^(?!api/|admin/|sitemap\.xml).*$', TemplateView.as_view(template_name="index.html")),
]
