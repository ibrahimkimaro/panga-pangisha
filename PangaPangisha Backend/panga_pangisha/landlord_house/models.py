from django.db import models
from authentications.models import User
# Create your models here.


# for landlord who create house include(rooms,settingroom and etc..) 
class House(models.Model):
    available_choices = [
        ('Available', 'Available'),
        ('Under Maintenance', 'Under Maintenance'),
        ('Rented', 'Rented'),
        ('Reserved', 'Reserved'),
    ] 
    id = models.BigAutoField(primary_key=True, blank=True,null=False)
    owner = models.ForeignKey(User,on_delete=models.CASCADE,related_name="HOUSE")
    house_type = models.CharField(max_length=255,null=True)
    self_container = models.IntegerField()
    self_container_size = models.DecimalField(max_digits=5,decimal_places=2,null=True)
    single_rooms = models.IntegerField()
    single_rooms_size = models.DecimalField(max_digits=5,decimal_places=2,null=True)
    water_services = models.CharField(max_length=255,null=True)
    amenities = models.JSONField(null=True, blank=True)
    city = models.CharField(max_length=255,null=True)
    district = models.CharField(max_length=255,null=True)
    latitude = models.DecimalField(max_digits=9,null=True,blank=True,decimal_places=6)
    langitude = models.DecimalField(max_digits=9,null=True,blank=True,decimal_places=6)
    description = models.CharField(max_length=10000,null=True)
    House_Document = models.FileField(upload_to='house Document/',null=True,blank=True)
    house_profile_image = models.ImageField(upload_to='house_profile/',null=True,blank=True)
    available = models.CharField(choices=available_choices, max_length=50, default='Available')
    created_at = models.DateTimeField(auto_now_add=True)

     
    def __str__(self):
        return f"{self.owner.fullname} {self.house_type}"


#for landlord who create rooms for renting so he must create house and rooms 
class House_With_Rooms(models.Model):
    id = models.BigAutoField(primary_key=True, blank=True,null=False)
    owner = models.ForeignKey(User,on_delete=models.CASCADE,related_name="HOUSE_WITH_ROOM")
    house_type = models.CharField(max_length=255,null=True)
    size_of_house = models.DecimalField(max_digits=10, decimal_places=2,null=True)
    total_rooms = models.IntegerField()
    master_rooms = models.IntegerField()
    master_price = models.DecimalField(max_digits=10, decimal_places=2,null=True)
    master_size = models.DecimalField(max_digits=5,decimal_places=2,null=True)
    standard_rooms = models.IntegerField()
    standard_price = models.DecimalField(max_digits=10, decimal_places=2,null=True)
    standard_size = models.DecimalField(max_digits=5,decimal_places=2,null=True)
    water_services = models.CharField(max_length=255,null=True)
    electricity = models.CharField(max_length=255,null=True)
    city = models.CharField(max_length=255,null=True)
    district = models.CharField(max_length=255,null=True)
    latitude = models.DecimalField(max_digits=9,null=True,blank=True,decimal_places=6)
    langitude = models.DecimalField(max_digits=9,null=True,blank=True,decimal_places=6)
    description = models.CharField(max_length=10000,null=True)
    house_profile_image = models.ImageField(upload_to='house_withRooms_profile_pics/',null=True,blank=True)
    location = models.CharField(max_length=255,null=True)
    available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)