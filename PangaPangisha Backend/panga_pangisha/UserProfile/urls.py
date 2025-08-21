from django.urls import path
from . import views

urlpatterns = [
    path('UserUpdateProfile/',views.UserProfilePicture.as_view(), name='user-profile'),
    path('update_profile_pic/',views.UserUpdateProfilePicture.as_view(), name='user-profile'),
]