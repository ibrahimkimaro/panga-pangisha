import django_filters
from . models import House


class HouseFilter(django_filters.FilterSet):
    class Meta:
        model = House
        fields = {'property_type':['exact'],
                  'district':['exact'],
                  # 'self_container_size':['exact'],
                  # 'single_rooms':['exact'],
                #   'house_profile_image':['exact'],
                #   'amenities':['exact'],
                #   'mkoa':['exact'],
                #   'wilaya':['exact'],
                #   'kata':['exact'],
                }
        
        