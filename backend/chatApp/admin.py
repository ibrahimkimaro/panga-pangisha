
from django.contrib import admin
from . models import ChatRoom,Message


@admin.register(ChatRoom)
class chatRoom(admin.ModelAdmin):
    list_display = ('id', 'created_at')

    
@admin.register(Message)
class messages(admin.ModelAdmin):
    list_display = ('id','room','sender', 'text','voice_message','image_message','status', 'timestamp')
    # list_editable = ('total_rooms', 'master_rooms', 'standard_rooms')


    # list_editable = ('total_rooms', 'master_rooms', 'standard_rooms')
