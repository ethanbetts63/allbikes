from django.contrib import admin
from .models import SiteSettings, TermsAndConditions

admin.site.register(SiteSettings)
admin.site.register(TermsAndConditions)
