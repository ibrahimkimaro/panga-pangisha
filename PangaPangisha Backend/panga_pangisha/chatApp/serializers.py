# chat/serializers.py
from rest_framework import serializers
from .models import ChatRoom, Message
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'fullname']

class PrivateRoomSerializer(serializers.ModelSerializer):
    participants = UserSerializer(many=True)

    class Meta:
        model = ChatRoom
        fields = ['id', 'participants', 'created_at']

class MessageSerializer(serializers.ModelSerializer):
    # sender = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'room', 'sender','text','voice_message','image_message','status', 'timestamp']


class VoiceMessageSerializer(serializers.ModelSerializer):
     class Meta:
        model = Message
        fields = ['id', 'room', 'sender', 'voice_message', 'timestamp']
