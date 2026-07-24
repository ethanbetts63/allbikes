from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0017_motorcycle_vehicle_type'),
    ]

    operations = [
        migrations.AddField(
            model_name='motorcycle',
            name='available_colours',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text='Colour names customers can choose for this motorcycle.',
            ),
        ),
    ]
