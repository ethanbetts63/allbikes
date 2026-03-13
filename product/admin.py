from django.contrib import admin
from .models import Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]
    list_display = ("name", "brand", "price", "stock_quantity", "is_active")
    list_filter = ("is_active", "brand")
    search_fields = ("name", "brand")


admin.site.register(ProductImage)
