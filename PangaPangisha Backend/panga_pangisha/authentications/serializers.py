from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
from phonenumber_field.serializerfields import PhoneNumberField
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = PhoneNumberField(region='TZ')
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['id','fullname','phone_number','email', 'role','password',]  

        

    def create(self, validated_data):
        return User.objects.create_user(
            fullname=validated_data['fullname'],
            password=validated_data['password'],
            phone_number=validated_data['phone_number'],
            role=validated_data['role']
        )


# class LoginSerializer(serializers.Serializer):
#     phone_number = PhoneNumberField(region='TZ')
#     password = serializers.CharField(write_only=True)

#     def validate(self, data):
#         user = authenticate(phone_number=data['phone_number'], password=data['password'])
#         if user and user.is_active:
#             data['user'] = user
#             return data
#         raise serializers.ValidationError("Invalid phone number or password.")

class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['email', 'fullname']  # or any fields you want user to update
        extra_kwargs = {
            'email': {'required': False}
        }


class CustomLoignSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add user ID to the response
        data['user_id'] = self.user.id
        data['role'] = self.user.role  # optional, if you want role
        return data
