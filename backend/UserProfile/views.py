from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import UserProfile
from .serializers import UserProfileSerializer
from authentications.models import User
from authentications.serializers import ProfileUpdateSerializer,UserSerializer

class UserProfilePicture(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = UserProfile.objects.get(user=request.user)
            serializer = UserProfileSerializer(profile)
            username = profile.user.fullname
            email = profile.user.email
            phone_number = profile.user.phone_number
            return Response({'data':serializer.data,'username':username,
                             'email':email,'phone_number':str(phone_number)})
        except UserProfile.DoesNotExist:
            return Response({"error": "Profile not found."}, status=status.HTTP_404_NOT_FOUND)


class UserUpdateProfilePicture(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request):
        profile = UserProfile.objects.get(user=request.user)
        serializer = UserProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    