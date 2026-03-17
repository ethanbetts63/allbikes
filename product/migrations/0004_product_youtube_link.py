from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("product", "0003_product_is_featured"),
    ]

    operations = [
        migrations.AddField(
            model_name="product",
            name="youtube_link",
            field=models.URLField(
                blank=True,
                null=True,
                help_text="An optional link to a YouTube video for this product.",
            ),
        ),
    ]
