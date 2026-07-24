from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('payments', '0007_order_terms_accepted'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='selected_colour',
            field=models.CharField(
                blank=True,
                help_text='The motorcycle colour selected by the customer at order time.',
                max_length=100,
            ),
        ),
    ]
