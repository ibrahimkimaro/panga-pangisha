from django.db import models

# Create your models here.

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatRoom(models.Model):
    id = models.BigAutoField(primary_key=True, blank=True,null=False)
    participants = models.ManyToManyField(User,related_name="chat_rooms")
    created_at = models.DateTimeField(auto_now_add=True)


class Message(models.Model):
    
    STATUS_CHOICE = [
        ('sent','Sent'),
        ('delivered','Delivered'),
        ('red','Read'),
    ]
      
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField(null=True,blank=True)
    voice_message = models.FileField(upload_to="message/Voice_Messages/",null=True,blank=True)
    image_message = models.ImageField(upload_to="message/image_message/",null=True,blank=True)
    status = models.CharField(choices=STATUS_CHOICE,max_length=15,default='sent')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.sender} at {self.timestamp}"
