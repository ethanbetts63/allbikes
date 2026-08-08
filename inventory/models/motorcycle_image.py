from django.db import models
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill, ResizeToFit

class MotorcycleImage(models.Model):
    motorcycle = models.ForeignKey(
        "inventory.Motorcycle", on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="motorcycles/additional/")
    
    # Thumbnail for small cards, listings, etc.
    thumbnail = ImageSpecField(source='image',
                                      processors=[ResizeToFill(400, 400)],
                                      format='WEBP',
                                      options={'quality': 75})

    # Medium size for detail pages
    medium = ImageSpecField(source='image',
                                    processors=[ResizeToFit(800, 600)],
                                    format='WEBP',
                                    options={'quality': 80})

    # Stock-alert emails only. Many listing photos are cut-outs whose transparent
    # surround holds white RGB, but resizing zeroes the RGB under the alpha (pilkit
    # hands RGBA straight to PIL's resize). An RGBA variant therefore shows up as a
    # black rectangle with a light fringe in any client or proxy that drops or
    # mis-composites the channel. JPEG carries no alpha to get wrong, and pilkit
    # mattes onto white on the way out.
    email = ImageSpecField(source='image',
                                   processors=[ResizeToFit(800, 600)],
                                   format='JPEG',
                                   options={'quality': 85})

    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Image for {self.motorcycle}"
