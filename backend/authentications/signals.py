# from django.db.models.signals import post_save
# from django.contrib.auth.models import Group
# from django.dispatch import receiver
# from django.conf import settings

# from django.contrib.auth import get_user_model
# User = get_user_model()

# @receiver(post_save, sender=User)
# def assign_default_group(sender, instance, created, **kwargs):
#     if created:
#         # Check if the user selected a role during registration
#         if hasattr(instance, 'role'):
#             role = instance.role
#             group_name = None

#             if role == 'landlord':
#                 group_name = 'Landlord'
#             elif role == 'renter':
#                 group_name = 'Renter'
#             elif role == 'investor':
#                 group_name = 'Investor'
#             # Add more roles if needed

#             if group_name:
#                 group = Group.objects.get(name=group_name)
#                 instance.groups.add(group)

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group
from .models import User

@receiver(post_save, sender=User)
def add_user_to_group(sender, instance, created, **kwargs):
    if created:
        if instance.role == 'landlord':
            group, _ = Group.objects.get_or_create(name='landlord')
            instance.groups.add(group)
        elif instance.role == 'renter':
            group, _ = Group.objects.get_or_create(name='renter')
            instance.groups.add(group)
