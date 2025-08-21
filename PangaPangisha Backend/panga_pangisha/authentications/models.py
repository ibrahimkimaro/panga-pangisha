from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin,Group, Permission
from django.contrib.auth.base_user import BaseUserManager
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField



class CustomUserManager(BaseUserManager):
   def create_user(self, phone_number, password=None, **extra_fields):
        if not phone_number:
            raise ValueError('Phone number is required')
        user = self.model(phone_number=phone_number,**extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
   
   def create_superuser(self, phone_number, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(phone_number, password, role='admin')
                                                              
class User(AbstractBaseUser,PermissionsMixin):
    
    Role_Choice = (
         ('landlord', 'Landlord'),
        ('renter', 'Renter'),
        ('investor', 'Investor'),
    )

    id = models.BigAutoField(primary_key=True, blank=True,null=False)
    fullname = models.CharField(max_length=200,verbose_name="full Name")
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = PhoneNumberField(blank=True,null=True,unique=True)
    role = models.CharField(max_length=20,choices=Role_Choice)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)
    # otp = models.CharField(max_length=6, blank=True, null=True)
    # otp_created_at = models.DateTimeField(null=True, blank=True)

    
    objects=CustomUserManager()
    
    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []
    
    
    # def generate_otp(self):
    #     self.otp = str(random.randint(100000, 999999))
    #     self.otp_created_at =  timezone.now()
    #     self.save()

    # def verify_otp(self, otp):
    #     if self.otp == otp and  (timezone.now() - self.otp_created_at).seconds < 300:
    #         self.otp = None  # Clear OTP after verification
    #         self.save()
    #         return True


    def __str__(self):
         
        return f"{self.fullname}"
    
