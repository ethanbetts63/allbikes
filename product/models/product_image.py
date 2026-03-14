from django.db import models
from imagekit.models import ImageSpecField
from imagekit.processors import ResizeToFill, ResizeToFit


class ProductImage(models.Model):
    product = models.ForeignKey(
        "product.Product", on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="products/")

    thumbnail = ImageSpecField(
        source="image",
        processors=[ResizeToFill(400, 400)],
        format="WEBP",
        options={"quality": 75},
    )

    medium = ImageSpecField(
        source="image",
        processors=[ResizeToFit(800, 600)],
        format="WEBP",
        options={"quality": 80},
    )

    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Image for {self.product}"
