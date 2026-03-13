from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0002_product_discount_price"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_featured",
            field=models.BooleanField(
                default=False,
                help_text="Show this product in the featured section on the home page.",
            ),
        ),
    ]
