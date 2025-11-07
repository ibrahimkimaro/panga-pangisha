from django.urls import path
from . import views

urlpatterns = [
    path('rooms/', views.PrivateRoomViewSet.as_view()),
    path('messages/', views.SaveMessageViewSet.as_view()),
    path('voice-messages/', views.VoiceMessageSaved.as_view()),
    path('validate-user/', views.ValidateUserAPIView.as_view(), name='validate user'),
    path('get-messages/<int:room_id>/',views.get_messaages.as_view()),
    path('get-create-user/',views.create_or_get_room_user.as_view()),
    path('get-room-message/<int:receiver_id>/', views.get_room_userMessage.as_view()),
]
