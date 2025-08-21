
from django.contrib import admin
from . models import House, House_With_Rooms

@admin.register(House)
class HouseAdmin(admin.ModelAdmin):
    list_display = ('id','owner','house_type','self_container', 'single_rooms','water_services','city','district','latitude','langitude','available')
    # list_editable = ('total_rooms', 'master_rooms', 'standard_rooms')
