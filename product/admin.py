from django.contrib import admin
from .models import Product, ProductImage


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
