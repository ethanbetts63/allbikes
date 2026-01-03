from django.contrib import admin
from .models import FAQ, SiteSettings, TermsAndConditions

admin.site.register(FAQ)
admin.site.register(SiteSettings)
admin.site.register(TermsAndConditions)
