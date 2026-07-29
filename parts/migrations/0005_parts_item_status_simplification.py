from django.db import migrations, models


def forwards(apps, schema_editor):
    """Legacy `ordered` and `fulfilled` both collapse into `to_order`.

    Per-line fulfilment is no longer tracked; completion is derived from the
    order status instead.
    """
    PartsOrderItem = apps.get_model('parts', 'PartsOrderItem')
    PartsOrderItem.objects.filter(status__in=['ordered', 'fulfilled']).update(status='to_order')


def backwards(apps, schema_editor):
    PartsOrderItem = apps.get_model('parts', 'PartsOrderItem')
    PartsOrderItem.objects.filter(status='to_order').update(status='ordered')


class Migration(migrations.Migration):

    dependencies = [
        ("parts", "0004_remove_partssettings_domestic_shipping_fee_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
        migrations.AlterField(
            model_name="partsorder",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending_payment", "Pending Payment"),
                    ("paid", "Paid"),
                    ("dispatched", "Dispatched"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                    ("refunded", "Refunded"),
                    ("partially_refunded", "Partially Refunded"),
                ],
                default="pending_payment",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="partsorderitem",
            name="status",
            field=models.CharField(
                choices=[("to_order", "To Order"), ("refunded", "Refunded")],
                default="to_order",
                max_length=20,
            ),
        ),
        migrations.RemoveField(
            model_name="partsorderitem",
            name="backorder_since",
        ),
    ]
