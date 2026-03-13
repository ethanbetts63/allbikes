from django.db import models
from django.utils.text import slugify


class Product(models.Model):
    LOW_STOCK_THRESHOLD = 3

    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="GST-inclusive price in AUD.",
    )
    discount_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Optional discounted GST-inclusive price in AUD.",
    )
    stock_quantity = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False, help_text="Show this product in the featured section on the home page.")
    slug = models.SlugField(max_length=255, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        expected_slug = slugify(f"{self.name}-{self.id}")
        if self.slug != expected_slug:
            Product.objects.filter(pk=self.pk).update(slug=expected_slug)
            self.slug = expected_slug
