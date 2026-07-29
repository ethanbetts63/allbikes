from django.contrib import admin
from .models import Product, ProductImage, ProductOrder


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]
    list_display = ("name", "brand", "price", "stock_quantity", "is_active", "is_featured")
    list_filter = ("is_active", "is_featured", "brand")
    list_editable = ("is_featured",)
    search_fields = ("name", "brand")


admin.site.register(ProductImage)


@admin.register(ProductOrder)
class ProductOrderAdmin(admin.ModelAdmin):
    list_display = ('order_reference', 'product', 'customer_name', 'status', 'total', 'created_at')
    list_filter = ('status',)
    search_fields = ('order_reference', 'customer_name', 'customer_email')
    readonly_fields = ('order_reference', 'access_token', 'created_at', 'updated_at')
