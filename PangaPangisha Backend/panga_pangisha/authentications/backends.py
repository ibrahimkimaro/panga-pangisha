from django.contrib.auth.backends import BaseBackend
from django.core.exceptions import MultipleObjectsReturned
from .models import User

class EmailOrPhoneBackend(BaseBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        user = None
        
        # Try email
        try:
            user = User.objects.get(email=username)
        except User.DoesNotExist:
            pass
        except MultipleObjectsReturned:
            # More than one user with this email - log or handle as needed
            return None
        
        # If not found by email, try phone number
        if user is None:
            try:
                user = User.objects.get(phone_number=username)
            except User.DoesNotExist:
                return None
            except MultipleObjectsReturned:
                # More than one user with this phone number
                return None
        
        if user.check_password(password) and user.is_active:
            return user
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
