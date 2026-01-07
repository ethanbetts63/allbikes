from django.db import models
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill

class MotorcycleImage(models.Model):
    motorcycle = models.ForeignKey(
        "inventory.Motorcycle", on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="motorcycles/additional/")
    
    # Thumbnail for small cards, listings, etc.
    thumbnail = ImageSpecField(source='image',
                                      processors=[ResizeToFill(400, 400)],
                                      format='WEBP',
                                      options={'quality': 80})

    # Medium size for detail pages
    medium = ImageSpecField(source='image',
                                    processors=[ResizeToFill(800, 600)],
                                    format='WEBP',
                                    options={'quality': 85})

    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Image for {self.motorcycle}"
