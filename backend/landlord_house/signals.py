from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import House, Unit


@receiver(post_save, sender=House)
def create_units_for_house(sender, instance, created, **kwargs):
    if created:
        for i in range(1, instance.total_units + 1):
            Unit.objects.create(
                house=instance,
                unit_number=f"U{i}",
                monthly_rent=instance.monthly_rent,
            )
        instance.available_units = instance.total_units
        instance.save()
