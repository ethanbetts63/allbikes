from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_reference', 'product', 'customer_name', 'customer_email', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['order_reference', 'customer_name', 'customer_email']
    readonly_fields = ['order_reference', 'created_at', 'updated_at']
