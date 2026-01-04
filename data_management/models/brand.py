from django.db import models

class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    serviceable = models.BooleanField(default=False)

    def __str__(self):
        return self.name
