from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField


class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number,email, password=None, **extra_fields):
        if not phone_number or email:
            raise ValueError(_("Phone number or Email is required"))
        
        extra_fields.setdefault("is_active", True)
        user = self.model(phone_number=phone_number,email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, email,password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")

        if not extra_fields.get("is_staff"):
            raise ValueError(_("Superuser must have is_staff=True."))
        if not extra_fields.get("is_superuser"):
            raise ValueError(_("Superuser must have is_superuser=True."))

        return self.create_user(phone_number, email,password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    class Roles(models.TextChoices):
        LANDLORD = "landlord", _("Landlord")
        RENTER = "renter", _("Renter")
        INVESTOR = "investor", _("Investor")
        ADMIN = "admin", _("Admin")

    id = models.BigAutoField(primary_key=True)
    fullname = models.CharField(max_length=200, verbose_name=_("Full Name"))
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = PhoneNumberField(unique=True, blank=False, null=False)
    role = models.CharField(max_length=20, choices=Roles.choices, default=Roles.RENTER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    EMAIL_FIELD= "email"
    REQUIRED_FIELDS = []  # Email is optional in this model

    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.fullname}"
