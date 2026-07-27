from django.contrib import admin

from .models import Part, PartsModel, PartSection, PartsSettings, SectionPart


class PartSectionInline(admin.TabularInline):
    model = PartSection
    extra = 0
    fields = ('code', 'group', 'name', 'sort_order')
    show_change_link = True


@admin.register(PartsModel)
class PartsModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'model_code', 'cc_class', 'is_active', 'last_ingested_at')
    list_filter = ('cc_class', 'is_active')
    search_fields = ('name', 'model_code')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [PartSectionInline]


class SectionPartInline(admin.TabularInline):
    model = SectionPart
    extra = 0
    raw_id_fields = ('part',)
    fields = ('ref_number', 'part', 'description', 'quantity', 'effective_date', 'sort_order')


@admin.register(PartSection)
class PartSectionAdmin(admin.ModelAdmin):
    list_display = ('parts_model', 'code', 'group', 'name')
    list_filter = ('group',)
    search_fields = ('code', 'name', 'parts_model__model_code')
    inlines = [SectionPartInline]


@admin.register(Part)
class PartAdmin(admin.ModelAdmin):
    list_display = ('part_number', 'description', 'colour_name', 'wholesale_price_incl_gst', 'available_qty', 'in_pa_feed')
    list_filter = ('in_pa_feed',)
    search_fields = ('part_number', 'base_part_number', 'description')


@admin.register(PartsSettings)
class PartsSettingsAdmin(admin.ModelAdmin):
    list_display = ('markup_percentage', 'shipping_fee', 'backorder_hold_days', 'enable_new_part_sales', 'updated_at')
