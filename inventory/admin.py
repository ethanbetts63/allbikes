from django.contrib import admin
from .models import (
    BikeOrder, Motorcycle, MotorcycleImage, StockAlertCampaign,
    StockAlertCampaignRecipient, StockAlertSubscriber,
)

class MotorcycleImageInline(admin.TabularInline):
    model = MotorcycleImage
    extra = 1  # How many extra forms to show

@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    inlines = [MotorcycleImageInline]
    list_display = ('make', 'model', 'year', 'vehicle_type', 'condition', 'status', 'price', 'stock_number')
    list_filter = ('vehicle_type', 'status', 'make', 'condition')
    search_fields = ('make', 'model', 'stock_number')

admin.site.register(MotorcycleImage)


@admin.register(StockAlertSubscriber)
class StockAlertSubscriberAdmin(admin.ModelAdmin):
    list_display = ('email', 'status', 'subscribed_at', 'unsubscribed_at')
    list_filter = ('status',)
    search_fields = ('email',)
    readonly_fields = ('unsubscribe_token', 'subscribed_at', 'updated_at')


class StockAlertCampaignRecipientInline(admin.TabularInline):
    model = StockAlertCampaignRecipient
    extra = 0
    readonly_fields = ('email', 'status', 'message', 'error_message', 'sent_at')


@admin.register(StockAlertCampaign)
class StockAlertCampaignAdmin(admin.ModelAdmin):
    list_display = ('subject', 'status', 'recipient_count', 'sent_count', 'failed_count', 'created_at')
    list_filter = ('status',)
    readonly_fields = ('created_at', 'sent_at')
    inlines = [StockAlertCampaignRecipientInline]


@admin.register(BikeOrder)
class BikeOrderAdmin(admin.ModelAdmin):
    list_display = ('order_reference', 'motorcycle', 'customer_name', 'status', 'deposit_amount', 'created_at')
    list_filter = ('status',)
    search_fields = ('order_reference', 'customer_name', 'customer_email')
    readonly_fields = ('order_reference', 'access_token', 'created_at', 'updated_at')
