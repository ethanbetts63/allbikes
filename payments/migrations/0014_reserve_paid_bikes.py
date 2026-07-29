from django.db import migrations


def reserve_bikes_with_successful_deposits(apps, schema_editor):
    Motorcycle = apps.get_model('inventory', 'Motorcycle')
    Motorcycle.objects.filter(
        status='for_sale',
        bike_orders__payments__status='succeeded',
    ).update(status='reserved')


class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0013_alter_payment_bike_order_alter_payment_hire_booking_and_more'),
    ]

    operations = [
        migrations.RunPython(
            reserve_bikes_with_successful_deposits,
            migrations.RunPython.noop,
        ),
    ]
