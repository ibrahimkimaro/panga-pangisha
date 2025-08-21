# chat/views.py
import base64
from rest_framework import permissions, status
from rest_framework.parsers import MultiPartParser, FormParser,JSONParser
from .models import ChatRoom, Message
from  .serializers import PrivateRoomSerializer, MessageSerializer,VoiceMessageSerializer
from authentications.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from django.core.files.base import ContentFile


class PrivateRoomViewSet(APIView):
    serializer_class = PrivateRoomSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ChatRoom.objects.filter(participants=self.request.user)

    def perform_create(self, serializer):
        room = serializer.save()
        room.participants.add(self.request.user)  # Creator
        # Add other participants manually or from request if needed

class MessageViewSet(APIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Message.objects.filter(room__participants=self.request.user).order_by('timestamp')

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

# chat/views.py


class ValidateUserAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self,request):
        try:
            user  = request.user
            print(user)
            return Response({"valid": True, "id": user.id,"name":user.fullname},status=200)
        except User.DoesNotExist:
            return Response({"valid": False}, status=404)


## save message kutoka kwenye go language server amabyo inaruhusu websocket na hii ni view ya kusave message kwneye database 
# but we dont specify who we want to to chat with so we tuna specify kwa room right inaweza ikawa ni groupChat
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import permissions
from .models import ChatRoom, Message
from .serializers import MessageSerializer

class SaveMessageViewSet(APIView):
    parser_classes = [MultiPartParser,JSONParser]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        #   base64_data = data.get("profile_image", {}).get("base64")

            # try:
            #     decoded_data = base64.b64decode(base64_data)
            # except Exception as e:
            #     print(f"Base64 decoding error: {str(e)}")
            #     return Response({"detail": "Invalid base64 data"})

            # image_name = data.get("profile_image", {}).get("name", "default.jpg")
            # file_type = data.get("profile_image", {}).get("type").split("/")[-1].lower()

            # if file_type not in ["jpeg", "png", "gif", "pdf"]:
            #     return Response({"detail": "Unsupported file type"})

            # image_content = ContentFile(decoded_data, name=image_name)
            # institution.profile_image.save(image_name, image_content, save=True)
            # serializer = UpdateInstitutionSerializer(institution, many=False)
        user = request.user
        room_id = request.data.get('room_id')
        content = request.data.get('text')
        voice = request.FILES.get('voice_message') 
        image = request.FILES.get("image_message")
        status = request.data.get('status')
        # try:
        #     decoded_data = base64.b64decode(image)
        # except Exception as e:
        #     print(f"Base64 decoding error: {str(e)}")
        #     return Response({"detail": "Invalid base64 data"})

        # image_name = data.get("image_message", {})
        # file_type = data.get("image_message", {}).get("type").split("/")[-1].lower()

        # if file_type not in ["jpeg", "png", "gif", "pdf"]:
        #     return Response({"detail": "Unsupported file type"})

        # image_content = ContentFile(decoded_data, name=image_name)

        try:
            room = ChatRoom.objects.filter(id=room_id).first()
            if not room:
                room = ChatRoom.objects.create()
                room.participants.add(user)
                print("Created new room:", room.id)
            elif not room.participants.filter(id=user.id).exists():
                room.participants.add(user)
                print("User added to existing room:", room.id)

            # Create the message
            message = Message.objects.create(
                room=room,
                sender=user,
                text=content if content else None,
                voice_message=voice if voice else None,
                image_message=image if image else None,
                status=status or "sent"
            )

            serializer = MessageSerializer(message)
            return Response({"message": serializer.data}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)


class VoiceMessageSaved(APIView):
    parser_classes = [MultiPartParser]
    permissions_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        room_id = request.data.get('room_id')
        audio_file = request.FILES.get('voice_message')
        

        room = None
        if room_id:
            try:
                room = ChatRoom.objects.get(id=room_id)
                print("Found room:", room)
            except ChatRoom.DoesNotExist:
                print("Room does not exist, creating new one")
        if not room:
            room = ChatRoom.objects.create()
            room.participants.add(user)
            print("Created room and added user:", room.id)

        # Auto-add user if not a participant
        if not room.participants.filter(id=user.id).exists():
            room.participants.add(user)
            print("User added to existing room participants")
        
        if audio_file:
             # Save the message
            message = Message.objects.create(
                    room=room_id,
                    sender = user,
                    audio_message = audio_file)
            serializer = VoiceMessageSerializer(message)

            return Response({
                "room_id": room.id,
                "message": serializer.data
            }, status=201)
        else:
            return Response({
                "ERROR":"no aoudio message providede"
            }, status=400)


            


class get_messaages(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self,request, room_id):
        try:
            room = ChatRoom.objects.get(id=room_id)
            if request.user not in room.participants.all():
                return Response({'detail': 'Not a participant'}, status=403)

            messages = Message.objects.filter(room=room).order_by('timestamp')
            serializer = MessageSerializer(messages, many=True)
            return Response(serializer.data)
        except ChatRoom.DoesNotExist:
            return Response({'detail': 'Room not found'}, status=404)
        

# class ya kumtumia au create a new room for chatting for a specific user through user_id

class create_or_get_room_user(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self,request):
        receiverID = request.data.get("user_id",None)
        if not receiverID:
            return Response({'details':"User Id is required"})

        try:
            receiver = User.objects.get(id=receiverID)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)
        
        sender = request.user
        room =  ChatRoom.objects.filter(participants=sender).filter(participants=receiver).first()

        if room:
            return Response({'room_id':room.id})
        
        room = ChatRoom.objects.create()
        room.participants.set([sender,receiver]) 
        # room.save()
        return Response({'room_id':room.id})


# get room messages with receiver ID mtu unaetaka kumtumia msg then haitosave chochote
class get_room_userMessage(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self,request,receiver_id):

        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=404)
        
        sender = request.user
        room =  ChatRoom.objects.filter(participants=sender).filter(participants=receiver).first()

        if room:
            return Response({'room_id':room.id})
        else:
            return Response({'detail': 'Not created the room for participant'}, status=403)

