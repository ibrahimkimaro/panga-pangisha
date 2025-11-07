from django.db import models, transaction
from authentications.models import User
from phonenumber_field.modelfields import PhoneNumberField



class House(models.Model):
    STATUS_CHOICES = [
        ('Available', 'Available'),
        ('Under Maintenance', 'Under Maintenance'),
        ('Rented', 'Rented'),
        ('Reserved', 'Reserved'),
    ]

    # Basic info
    id = models.BigAutoField(primary_key=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="houses")
    property_name = models.CharField(max_length=255, blank=True, null=True)
    property_type = models.CharField(max_length=255, blank=True, null=True)
    property_category = models.CharField(max_length=255, blank=True, null=True)
    furnishing_status = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    # Location
    region = models.CharField(max_length=255, blank=True, null=True)
    district = models.CharField(max_length=255, blank=True, null=True)
    ward = models.CharField(max_length=255, blank=True, null=True)
    street = models.CharField(max_length=255, blank=True, null=True)
    house_number = models.IntegerField(blank=True, null=True)
    landmark = models.CharField(max_length=255, blank=True, null=True)

    # Property details
    total_units = models.PositiveIntegerField(default=1)
    available_units = models.PositiveIntegerField(default=1)
    bedrooms = models.IntegerField(blank=True, null=True)
    square_feet = models.IntegerField(blank=True, null=True)
    floor = models.IntegerField(blank=True, null=True)
    total_floors = models.IntegerField(blank=True, null=True)
    parking_spaces = models.IntegerField(blank=True, null=True)
    year_built = models.IntegerField(blank=True, null=True)

    # Pricing
    monthly_rent = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    security_deposit = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)
    maintenance_fee = models.DecimalField(max_digits=9, decimal_places=2, blank=True, null=True)

    # Extras
    amenities = models.JSONField(blank=True, null=True)

    # Contact
    contact_name = models.CharField(max_length=255, blank=True, null=True)
    contact_phone = PhoneNumberField(blank=True, null=True)
    contact_email = models.EmailField(blank=True, null=True)
    contact_hours = models.CharField(max_length=255, blank=True, null=True)

    # Media
    house_document = models.FileField(upload_to='house_documents/', blank=True, null=True)
    cover_image = models.ImageField(upload_to='house_cover_images/', blank=True, null=True)

    # Rules & status
    lease_duration = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(choices=STATUS_CHOICES, max_length=50, default='Available')

    # Location coords
    latitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.property_name or 'Unnamed'} - {self.owner.fullname}"

    @property
    def total_units_count(self):
        return self.units.count()

    @property
    def available_units_count(self):
        return self.units.filter(status='available').count()
    


class Unit(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('reserved', 'Reserved'),
        ('rented', 'Rented'),
        ('maintenance', 'Under Maintenance'),
    ]


    class Meta:
        unique_together = ('house', 'unit_number')

    def __str__(self):
        return f"{self.house.property_name or 'House'} - {self.unit_number} ({self.status})"


class Lease(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.PROTECT, related_name='leases')
    tenant = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['unit', 'start_date'], name='unique_lease_start_per_unit')
        ]

    def __str__(self):
        return f"Lease for {self.unit.unit_number} ({'Active' if self.active else 'Ended'})"


class HouseImage(models.Model):
    house = models.ForeignKey('House', on_delete=models.CASCADE, related_name='images')
    images = models.ImageField(upload_to='house_images/',blank=True, null=True)
    caption = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Image for {self.house or 'Unnamed House'}"
