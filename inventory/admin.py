from django.contrib import admin
from .models import Motorcycle, MotorcycleImage

class MotorcycleImageInline(admin.TabularInline):
    model = MotorcycleImage
    extra = 1  # How many extra forms to show

@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    inlines = [MotorcycleImageInline]
    list_display = ('make', 'model', 'year', 'condition', 'status', 'is_featured', 'price', 'stock_number')
    list_filter = ('status', 'is_featured', 'make', 'condition')
    search_fields = ('make', 'model', 'stock_number')

admin.site.register(MotorcycleImage)