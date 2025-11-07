from django.db.models import CharField
from django.http import JsonResponse
from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import UserSerializer, CustomLoignSerializer
from .backends import EmailOrPhoneBackend
from .models import User
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import generics, permissions
from .serializers import ProfileUpdateSerializer
from django.db.models.functions import Cast

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'user': serializer.data,
                'tokens': get_tokens_for_user(user)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class CustomLoginPairView(TokenObtainPairView):
    serializer_class = CustomLoignSerializer


class GetMe(APIView):
    def get(self,request):
        user = request.user
        serializer = UserSerializer(user)
        return Response(serializer.data)

class UpdateProfileView(generics.UpdateAPIView):
    serializer_class = ProfileUpdateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user



"""
users  = User.objects.all().exclude(id=user).values(
            'id',
            'fullname',
            'User_Profile__profile_image'
        )
# hii inausaidia kupata user wote ila tuna mtoa alietuma maombi or query ya APIA KUFETCH DATA,,
# pia . values() hii ni method ya kuchukua data kwenye app nyingine ikiwa user yuko na relationship na iyo table/app oneToOne or foreign key
# na jinsi ya kuchukua unaandika related_name ya ile table the follow with 2 under score(__) the name of the field or column
"""
class get_all_users(APIView):
    def get(self,request):
        user = request.user.id
        users  = User.objects.all().exclude(id=user).annotate(
            phone_str = Cast('phone_number',output_field=CharField())
        ).values(
            'id',
            'fullname',
            'phone_str',
            'User_Profile__profile_image',
        
        )
        # serializer = RegisterSerializer(users,many=True)
        return JsonResponse(list(users),safe=False)

