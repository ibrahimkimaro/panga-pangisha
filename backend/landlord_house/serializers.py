from rest_framework import serializers
from .models import House, Unit, Lease, HouseImage



class HouseProfileImageSerilaizer(serializers.ModelSerializer):
    house_profile_image = serializers.ImageField()

    class Meta:
        model = House
        fields = ['house_profile_image']



class HouseImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = HouseImage
        fields = ['id', 'images', 'caption']



class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = '__all__'


class LeaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = '__all__'



class HouseSerializer(serializers.ModelSerializer):
    images = HouseImageSerializer(many=True, read_only=True)
    units = UnitSerializer(many=True, read_only=True)

    # For uploading multiple images
    upload_images = serializers.ListField(
        child=serializers.ImageField(max_length=100000, allow_empty_file=False),
        write_only=True,
        required=False
    )

    # List of amenities
    amenities = serializers.ListField(
        child=serializers.ChoiceField(choices=[
            "WiFi", "Parking", "CCTV", "Water Supply", "security", "Laundry Area","Playground","GYM"
            "Air Conditioning","Power Backup","Storage","Garden"
        ]),
        required=True
    )


    class Meta:
        model = House
        fields = [
            'id', 'owner', 'property_name', 'property_type', 'property_category',
            'furnishing_status', 'description',
            'region', 'district', 'ward', 'street', 'house_number', 'landmark',
            'total_units', 'available_units', 'bedrooms', 'square_feet',
            'floor', 'total_floors', 'parking_spaces', 'year_built',
            'monthly_rent', 'security_deposit', 'maintenance_fee',
            'amenities', 'contact_name', 'contact_phone', 'contact_email', 'contact_hours',
            'house_document', 'cover_image',
            'lease_duration', 'status', 'latitude', 'longitude',
            'images', 'units', 'upload_images', 'created_at'
        ]

        read_only_fields = ['id', 'owner', 'available_units', 'units', 'images', 'created_at']

    # def create(self, validated_data):
    #     # 1. Pop fields not directly on House model (like total_units is not required for ModelSerializer)
    #     total_units = validated_data.pop('total_units', 0)
    #     upload_images = validated_data.pop('images', [])
        
    #     user = self.context['request'].user
        
    #     # 3. Save the House object
    #     house = House.objects.create(owner=user, **validated_data) # Note: all other fields are automatically handled by ModelSerializer

    #     # 4. Create multiple images
    #     for img_data in upload_images:
    #         HouseImage.objects.create(house=house, image=img_data)

    #     # 5. Auto-create units
    #     for i in range(total_units):
    #         Unit.objects.create(house=house, unit_number=f"U{i+1}", status='available')

        # return house
# class HouseSerializer(serializers.ModelSerializer):
#     house_type = serializers.CharField(max_length=255)
#     self_container = serializers.IntegerField()
#     self_container_size = serializers.DecimalField(max_digits=5,decimal_places=2)
#     single_rooms = serializers.IntegerField()
#     single_rooms_size = serializers.DecimalField(max_digits=5,decimal_places=2)
#     water_services = serializers.CharField(max_length=255)
#     description = serializers.CharField(max_length=10000)
#     amenities = serializers.ListField(
#         child=serializers.ChoiceField(choices=[
#             "WiFi", "Parking", "CCTV", "Water tank", "Security", "Laundry Area","Playground","Store room"
#         ]),
#         required=True
#     )
#     city = serializers.CharField(max_length=255)
#     district = serializers.CharField(max_length=255)
#     latitude = serializers.DecimalField(max_digits=9,decimal_places=6)
#     langitude = serializers.DecimalField(max_digits=9,decimal_places=6)
#     House_Document = serializers.FileField()
    
    
#     class Meta:
#         model = House
#         # fielsd = '__all__'
#         # exclude = ['id','house_profile_image']
#         fields = [
#             'id',
#             'house_type',
#             'self_container','self_container_size',
#             'single_rooms','single_rooms_size',
#             'water_services',
#             'city','district',
#             'amenities',
#             'description',
#             'latitude',
#             'langitude',
#             'House_Document',
#             'house_profile_image',
#             'available',
#                   ]


