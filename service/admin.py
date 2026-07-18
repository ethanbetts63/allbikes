from django.contrib import admin
from .models import ServiceSettings, Booking, BlockedDate

admin.site.register(ServiceSettings)


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('customer_name', 'vehicle_label', 'registration', 'drop_off_date', 'drop_off_time', 'status', 'source')
    list_filter = ('status', 'source', 'drop_off_date')
    search_fields = ('customer_name', 'registration', 'make', 'model', 'customer_phone', 'customer_email')
    date_hierarchy = 'drop_off_date'


@admin.register(BlockedDate)
class BlockedDateAdmin(admin.ModelAdmin):
    list_display = ('date', 'reason', 'created_at')
