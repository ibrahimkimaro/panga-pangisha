from rest_framework import serializers
from .models import UserProfile
from authentications.models import User

class UserProfileSerializer(serializers.ModelSerializer):
    # class Meta:
    #     model = User
    #     fields = ['id','fullname','phone_number','email', 'role']
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'profile_image', 'bio', 'location']
        read_only_fields = ['user']
