from django.db import models

class MotorcycleImage(models.Model):
    motorcycle = models.ForeignKey(
        "inventory.Motorcycle", on_delete=models.CASCADE, related_name="images"
    )
    image = models.ImageField(upload_to="motorcycles/additional/")
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"Image for {self.motorcycle}"
