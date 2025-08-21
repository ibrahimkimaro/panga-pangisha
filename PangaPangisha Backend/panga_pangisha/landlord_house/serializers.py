from rest_framework import serializers
from .models import House,House_With_Rooms


class HouseSerializer(serializers.ModelSerializer):
    house_type = serializers.CharField(max_length=255)
    self_container = serializers.IntegerField()
    self_container_size = serializers.DecimalField(max_digits=5,decimal_places=2)
    single_rooms = serializers.IntegerField()
    single_rooms_size = serializers.DecimalField(max_digits=5,decimal_places=2)
    water_services = serializers.CharField(max_length=255)
    description = serializers.CharField(max_length=10000)
    amenities = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            "WiFi", "Parking", "CCTV", "Water tank", "Security", "Laundry Area","Playground","Store room"
        ]),
        required=True
    )
    city = serializers.CharField(max_length=255)
    district = serializers.CharField(max_length=255)
    latitude = serializers.DecimalField(max_digits=9,decimal_places=6)
    langitude = serializers.DecimalField(max_digits=9,decimal_places=6)
    House_Document = serializers.FileField()
    
    
    class Meta:
        model = House
        # fielsd = '__all__'
        # exclude = ['id','house_profile_image']
        fields = [
            'id',
            'house_type',
            'self_container','self_container_size',
            'single_rooms','single_rooms_size',
            'water_services',
            'city','district',
            'amenities',
            'description',
            'latitude',
            'langitude',
            'House_Document',
            'house_profile_image',
            'available',
                  ]


class House_WithRooms_Serializer(serializers.ModelSerializer):
    #user = serializers.CharField()
    aina_ya_nyumba = serializers.CharField(max_length=255)
    ukubwa_wa_nyumba = serializers.CharField(max_length=255)
    total_rooms = serializers.IntegerField()
    master_rooms = serializers.IntegerField()
    master_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    master_urefu = serializers.DecimalField(max_digits=5,decimal_places=2)
    master_upana = serializers.DecimalField(max_digits=5,decimal_places=2)
    standard_rooms = serializers.IntegerField()
    standard_price = serializers.DecimalField(max_digits=10, decimal_places=2) 
    standard_urefu = serializers.DecimalField(max_digits=5,decimal_places=2)
    standard_upana = serializers.DecimalField(max_digits=5,decimal_places=2)
    water_services = serializers.CharField(max_length=255)
    electricity = serializers.CharField(max_length=255)
    mkoa = serializers.CharField(max_length=255)
    wilaya = serializers.CharField(max_length=255)
    kata = serializers.CharField(max_length=255)
    description = serializers.CharField(max_length=10000)
    
    class Meta:
        model = House_With_Rooms
        fields = [
            'id',
            'user',
            'aina_ya_nyumba',
                  'ukubwa_wa_nyumba','total_rooms',
                  'master_rooms','master_price','master_urefu','master_upana',
                  'standard_rooms','standard_price','standard_urefu','standard_upana',
                  'maji','umeme',
                  'mkoa','wilaya','kata',
                  'description',
                  'house_profile_image'
                  ]
        

class HouseProfileImageSerilaizer(serializers.ModelSerializer):
    house_profile_image = serializers.ImageField()

    class Meta:
        model = House
        fields = ['house_profile_image']

