from django.contrib import admin
from .models import House, Unit, Lease


# --- Inline Configurations (for nested editing in admin) ---
class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0
    readonly_fields = ('status',)
    fields = ('unit_number', 'floor', 'bedrooms', 'square_feet', 'monthly_rent', 'status')


class LeaseInline(admin.TabularInline):
    model = Lease
    extra = 0
    readonly_fields = ('created_at',)
    fields = ('tenant', 'start_date', 'end_date', 'monthly_rent', 'security_deposit', 'active')


# --- Main Models Registration ---
@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('property_name', 'owner', 'region', 'status', 'total_units', 'available_units', 'created_at')
    list_filter = ('status', 'region', 'district', 'property_category')
    search_fields = ('property_name', 'owner__username', 'region', 'district')
    readonly_fields = ('available_units',)
    inlines = [UnitInline]
    ordering = ('-created_at',)

    fieldsets = (
        ('Basic Information', {
            'fields': ('owner', 'property_name', 'property_type', 'property_category', 'furnishing_status', 'description')
        }),
        ('Location Details', {
            'fields': ('region', 'district', 'ward', 'street', 'house_number', 'landmark')
        }),
        ('Property Details', {
            'fields': (
                'total_units', 'available_units', 'bedrooms', 'square_feet',
                'floor', 'total_floors', 'parking_spaces', 'year_built'
            )
        }),
        ('Pricing & Fees', {
            'fields': ('monthly_rent', 'security_deposit', 'maintenance_fee')
        }),
        ('Contact Information', {
            'fields': ('contact_name', 'contact_phone', 'contact_email', 'contact_hours')
        }),
        ('Extras', {
            'fields': ('amenities', 'house_document', 'cover_image', 'lease_duration', 'status')
        }),
        ('Location Coordinates', {
            'fields': ('latitude', 'longitude')
        }),
        # ('Timestamps', {
        #     'fields': ('created_at',),
        # }),
    )


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('id','unit_number', 'house', 'status', 'monthly_rent', 'floor', 'bedrooms')
    list_filter = ('status', 'house__region', 'house__district')
    search_fields = ('unit_number', 'house__property_name')
    inlines = [LeaseInline]
    ordering = ('house', 'unit_number')


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ('unit', 'tenant', 'start_date', 'end_date', 'monthly_rent', 'active')
    list_filter = ('active', 'start_date', 'end_date')
    search_fields = ('unit__unit_number', 'tenant__username')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
