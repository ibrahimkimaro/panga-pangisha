from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserRegistration(admin.ModelAdmin):
    list_display = ['id','user','profile_image','bio']
# Register your models here.
