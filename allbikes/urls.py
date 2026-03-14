from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.http import HttpResponsePermanentRedirect
from data_management.views.token_views import (
    CookieTokenObtainPairView,
    CookieTokenRefreshView,
    CookieLogoutView,
)
from django.contrib.sitemaps.views import sitemap
from .sitemaps import MotorcycleSitemap, StaticViewSitemap

def strip_trailing_slash(request, path):
    return HttpResponsePermanentRedirect(f'/{path}')

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
    path("api/product/", include("product.urls")),
    path("api/payments/", include("payments.urls")),
    path("api/notifications/", include("notifications.urls")),

    # Sitemap
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='django.contrib.sitemaps.views.sitemap'),

    # JWT Token Authentication Endpoints
    path('api/token/', CookieTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'),
    path('api/token/logout/', CookieLogoutView.as_view(), name='token_logout'),
    
    # Redirect trailing slashes to canonical non-slash URLs (301)
    re_path(r'^(?!api/|admin/|sitemap\.xml)(.+)/$', strip_trailing_slash),

    # Catch-all for the React frontend
    re_path(r'^(?!api/|admin/|sitemap\.xml).*$', TemplateView.as_view(template_name="index.html")),
]
