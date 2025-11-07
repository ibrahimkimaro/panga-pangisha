from django.db import models
from authentications.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE,related_name="User_Profile")
    profile_image = models.ImageField(upload_to='profiles_picture/')
    bio = models.TextField(blank=True)
    location = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.user.fullname or self.user.phone_number}"