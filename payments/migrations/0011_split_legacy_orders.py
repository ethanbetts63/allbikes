from django.db import migrations


def split_legacy_orders(apps, schema_editor):
    LegacyOrder = apps.get_model('payments', 'Order')
    Payment = apps.get_model('payments', 'Payment')
    ProductOrder = apps.get_model('product', 'ProductOrder')
    BikeOrder = apps.get_model('inventory', 'BikeOrder')
    Product = apps.get_model('product', 'Product')
    DepositSettings = apps.get_model('payments', 'DepositSettings')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Message = apps.get_model('notifications', 'Message')

    invalid = LegacyOrder.objects.filter(product__isnull=True, motorcycle__isnull=True).count()
    invalid += LegacyOrder.objects.filter(product__isnull=False, motorcycle__isnull=False).count()
    if invalid:
        raise RuntimeError(
            f'Cannot split payments.Order: {invalid} row(s) do not have exactly one item target.'
        )

    deposit_settings = DepositSettings.objects.order_by('pk').first()
    fallback_deposit = deposit_settings.deposit_amount if deposit_settings else 0

    for legacy in LegacyOrder.objects.select_related('product', 'motorcycle').iterator():
        payment = Payment.objects.filter(order_id=legacy.pk).first()
        if legacy.product_id:
            product = Product.objects.get(pk=legacy.product_id)
            live_price = product.discount_price if product.discount_price and product.discount_price > 0 else product.price
            snapshot = legacy.amount_paid or (payment.amount if payment else None) or live_price
            created = ProductOrder.objects.create(
                pk=legacy.pk,
                product_id=legacy.product_id,
                order_reference=legacy.order_reference,
                customer_name=legacy.customer_name,
                customer_email=legacy.customer_email,
                customer_phone=legacy.customer_phone,
                address_line1=legacy.address_line1,
                address_line2=legacy.address_line2,
                suburb=legacy.suburb,
                state=legacy.state,
                postcode=legacy.postcode,
                country='Australia',
                unit_price_incl_gst=snapshot,
                total=snapshot,
                amount_paid=legacy.amount_paid,
                status=legacy.status,
                terms_accepted=legacy.terms_accepted,
            )
            ProductOrder.objects.filter(pk=created.pk).update(
                created_at=legacy.created_at, updated_at=legacy.updated_at
            )
            if payment:
                payment.product_order_id = created.pk
                payment.save(update_fields=['product_order'])
        else:
            snapshot = (payment.amount if payment else None) or legacy.amount_paid or fallback_deposit
            created = BikeOrder.objects.create(
                pk=legacy.pk,
                motorcycle_id=legacy.motorcycle_id,
                order_reference=legacy.order_reference,
                selected_colour=legacy.selected_colour,
                customer_name=legacy.customer_name,
                customer_email=legacy.customer_email,
                customer_phone=legacy.customer_phone,
                deposit_amount=snapshot,
                amount_paid=legacy.amount_paid,
                status=legacy.status,
                terms_accepted=legacy.terms_accepted,
            )
            BikeOrder.objects.filter(pk=created.pk).update(
                created_at=legacy.created_at, updated_at=legacy.updated_at
            )
            if payment:
                payment.bike_order_id = created.pk
                payment.save(update_fields=['bike_order'])

    old_ct = ContentType.objects.filter(app_label='payments', model='order').first()
    if old_ct:
        product_ct, _ = ContentType.objects.get_or_create(app_label='product', model='productorder')
        bike_ct, _ = ContentType.objects.get_or_create(app_label='inventory', model='bikeorder')
        for message in Message.objects.filter(content_type_id=old_ct.pk).iterator():
            if ProductOrder.objects.filter(pk=message.object_id).exists():
                message.content_type_id = product_ct.pk
            elif BikeOrder.objects.filter(pk=message.object_id).exists():
                message.content_type_id = bike_ct.pk
            else:
                raise RuntimeError(
                    f'Cannot migrate Message {message.pk}: legacy Order {message.object_id} was not copied.'
                )
            message.save(update_fields=['content_type'])

    if ProductOrder.objects.count() != LegacyOrder.objects.filter(product__isnull=False).count():
        raise RuntimeError('ProductOrder reconciliation failed during legacy split.')
    if BikeOrder.objects.count() != LegacyOrder.objects.filter(motorcycle__isnull=False).count():
        raise RuntimeError('BikeOrder reconciliation failed during legacy split.')


def reverse_split(apps, schema_editor):
    Payment = apps.get_model('payments', 'Payment')
    ProductOrder = apps.get_model('product', 'ProductOrder')
    BikeOrder = apps.get_model('inventory', 'BikeOrder')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    Message = apps.get_model('notifications', 'Message')

    old_ct = ContentType.objects.filter(app_label='payments', model='order').first()
    product_ct = ContentType.objects.filter(app_label='product', model='productorder').first()
    bike_ct = ContentType.objects.filter(app_label='inventory', model='bikeorder').first()
    if old_ct:
        if product_ct:
            Message.objects.filter(content_type_id=product_ct.pk).update(content_type_id=old_ct.pk)
        if bike_ct:
            Message.objects.filter(content_type_id=bike_ct.pk).update(content_type_id=old_ct.pk)

    Payment.objects.update(product_order=None, bike_order=None)
    ProductOrder.objects.filter(order_reference__startswith='SS-').delete()
    BikeOrder.objects.filter(order_reference__startswith='SS-').delete()


class Migration(migrations.Migration):
    dependencies = [
        ('payments', '0010_payment_bike_order_payment_product_order'),
        ('notifications', '0010_alter_message_message_type'),
    ]

    operations = [migrations.RunPython(split_legacy_orders, reverse_split)]
