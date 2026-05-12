from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("inventory", "0015_remove_motorcycle_monthly_rate_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="motorcycle",
            name="is_lams_approved",
            field=models.BooleanField(
                default=False,
                help_text="This motorcycle is LAMS (Learner Approved Motorcycle Scheme) approved.",
            ),
        ),
    ]
