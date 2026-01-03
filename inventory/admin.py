from django.contrib import admin
from .models import Motorcycle, MotorcycleImage, MotorcycleCondition

class MotorcycleImageInline(admin.TabularInline):
    model = MotorcycleImage
    extra = 1  # How many extra forms to show

@admin.register(Motorcycle)
class MotorcycleAdmin(admin.ModelAdmin):
    inlines = [MotorcycleImageInline]
    list_display = ('make', 'model', 'year', 'display_conditions', 'status', 'price', 'stock_number')
    list_filter = ('status', 'make', 'conditions')
    search_fields = ('make', 'model', 'stock_number')

    def display_conditions(self, obj):
        return ", ".join([condition.name for condition in obj.conditions.all()])
    display_conditions.short_description = 'Conditions'

@admin.register(MotorcycleCondition)
class MotorcycleConditionAdmin(admin.ModelAdmin):
    list_display = ('name', 'display_name')

admin.site.register(MotorcycleImage)