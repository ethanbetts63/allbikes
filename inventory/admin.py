from django.contrib import admin
from .models import Motorcycle, MotorcycleImage, MotorcycleCondition

class MotorcycleImageInline(admin.TabularInline):
    model = MotorcycleImage
    extra = 1  # How many extra forms to show

@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    inlines = [MotorcycleImageInline]
    list_display = ('make', 'model', 'year', 'condition', 'status', 'price', 'stock_number')
    list_filter = ('condition', 'status', 'make')
    search_fields = ('make', 'model', 'stock_number')

@admin.register(MotorcycleCondition)
class MotorcycleConditionAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name')

admin.site.register(MotorcycleImage)