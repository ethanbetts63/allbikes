from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction
from django.urls import reverse
from rest_framework.test import APIClient

from inventory.models import BikeOrder
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from payments.models import DepositSettings, Payment
from payments.tests.factories.order_factory import BikeOrderFactory, ProductOrderFactory
from product.models import ProductOrder
from product.tests.factories.product_factory import ProductFactory
from payments.utils.webhook_handlers import handle_payment_intent_succeeded


pytestmark = pytest.mark.django_db


def test_order_models_have_domain_specific_references():
    assert ProductOrderFactory().order_reference.startswith('PR-')
    assert BikeOrderFactory().order_reference.startswith('BK-')


def test_payment_requires_exactly_one_target():
    with pytest.raises(IntegrityError), transaction.atomic():
        Payment.objects.create(stripe_payment_intent_id='pi_none', amount='1.00')


def test_payment_rejects_multiple_targets():
    with pytest.raises(IntegrityError), transaction.atomic():
        Payment.objects.create(
            product_order=ProductOrderFactory(),
            bike_order=BikeOrderFactory(),
            stripe_payment_intent_id='pi_multiple',
            amount='1.00',
        )


def test_product_order_creation_snapshots_price_and_returns_token():
    product = ProductFactory(price='1299.00', discount_price='1099.00', stock_quantity=2)
    response = APIClient().post(reverse('product:order-create'), {
        'product': product.pk,
        'customer_name': 'Pat Rider',
        'customer_email': 'pat@example.com',
        'customer_phone': '0400000000',
        'address_line1': '1 St Georges Terrace',
        'address_line2': '',
        'suburb': 'Perth',
        'state': 'WA',
        'postcode': '6000',
        'terms_accepted': True,
    }, format='json')

    assert response.status_code == 201
    order = ProductOrder.objects.get(pk=response.data['id'])
    assert order.total == Decimal('1099.00')
    assert response.data['order_kind'] == 'product'
    assert response.data['access_token'] == order.access_token


def test_bike_order_creation_snapshots_deposit():
    DepositSettings.objects.update_or_create(pk=1, defaults={'deposit_amount': '750.00'})
    bike = MotorcycleFactory(status='for_sale', condition='new', available_colours=['Black'])
    response = APIClient().post(reverse('inventory:bike-order-create'), {
        'motorcycle': bike.pk,
        'selected_colour': 'black',
        'customer_name': 'Pat Rider',
        'customer_email': 'pat@example.com',
        'customer_phone': '0400000000',
        'terms_accepted': True,
    }, format='json')

    assert response.status_code == 201
    order = BikeOrder.objects.get(pk=response.data['id'])
    assert order.deposit_amount == Decimal('750.00')
    assert order.selected_colour == 'Black'
    assert response.data['order_kind'] == 'bike'


def test_customer_detail_requires_matching_access_token():
    order = ProductOrderFactory()
    url = reverse('product:order-detail', args=[order.order_reference])
    assert APIClient().get(url).status_code == 403
    assert APIClient().get(url, {'token': order.access_token}).status_code == 403
    assert APIClient().get(url, HTTP_X_CUSTOMER_ACCESS_TOKEN='wrong').status_code == 404
    assert APIClient().get(
        url, HTTP_X_CUSTOMER_ACCESS_TOKEN=order.access_token
    ).status_code == 200


def test_bike_customer_detail_requires_token_header():
    order = BikeOrderFactory()
    url = reverse('inventory:bike-order-detail', args=[order.order_reference])
    assert APIClient().get(url, {'token': order.access_token}).status_code == 403
    assert APIClient().get(
        url, HTTP_X_CUSTOMER_ACCESS_TOKEN=order.access_token
    ).status_code == 200


def test_admin_cannot_mark_paid_without_payment(admin_client):
    order = ProductOrderFactory()
    response = admin_client.patch(
        reverse('product:admin-order-detail', args=[order.pk]),
        {'status': 'paid'},
        content_type='application/json',
    )
    assert response.status_code == 400


def test_admin_can_mark_paid_with_payment(admin_client):
    order = ProductOrderFactory()
    Payment.objects.create(
        product_order=order, stripe_payment_intent_id='pi_product', amount=order.total
    )
    response = admin_client.patch(
        reverse('product:admin-order-detail', args=[order.pk]),
        {'status': 'paid'},
        content_type='application/json',
    )
    assert response.status_code == 200
    assert response.data['status'] == 'paid'


def test_product_webhook_marks_paid_and_decrements_stock_once(mocker):
    mocker.patch('payments.utils.webhook_handlers.send_product_customer_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_product_admin_new_order')
    product = ProductFactory(stock_quantity=2)
    order = ProductOrderFactory(product=product, total='100.00', unit_price_incl_gst='100.00')
    Payment.objects.create(
        product_order=order, stripe_payment_intent_id='pi_product_webhook', amount='100.00'
    )

    event = {'id': 'pi_product_webhook'}
    handle_payment_intent_succeeded(event)
    handle_payment_intent_succeeded(event)

    order.refresh_from_db()
    product.refresh_from_db()
    assert order.status == 'paid'
    assert order.amount_paid == Decimal('100.00')
    assert product.stock_quantity == 1


@pytest.mark.parametrize('condition', ['used', 'demo'])
def test_bike_webhook_marks_deposit_paid_and_reserves_motorcycle(mocker, condition):
    mocker.patch('payments.utils.webhook_handlers.send_bike_customer_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_bike_admin_new_order')
    order = BikeOrderFactory(motorcycle__condition=condition, deposit_amount='500.00')
    Payment.objects.create(
        bike_order=order, stripe_payment_intent_id=f'pi_bike_webhook_{condition}', amount='500.00'
    )

    handle_payment_intent_succeeded({'id': f'pi_bike_webhook_{condition}'})

    order.refresh_from_db()
    order.motorcycle.refresh_from_db()
    assert order.status == 'paid'
    assert order.amount_paid == Decimal('500.00')
    assert order.motorcycle.status == 'reserved'


def test_bike_webhook_does_not_reserve_a_new_motorcycle(mocker):
    """A deposit on a new bike is accepted, but the bike stays for sale."""
    mocker.patch('payments.utils.webhook_handlers.send_bike_customer_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_bike_admin_new_order')
    order = BikeOrderFactory(motorcycle__condition='new', deposit_amount='500.00')
    Payment.objects.create(
        bike_order=order, stripe_payment_intent_id='pi_bike_webhook_new', amount='500.00'
    )

    handle_payment_intent_succeeded({'id': 'pi_bike_webhook_new'})

    order.refresh_from_db()
    order.motorcycle.refresh_from_db()
    assert order.status == 'paid'
    assert order.amount_paid == Decimal('500.00')
    assert order.motorcycle.status == 'for_sale'


def test_bike_webhook_does_not_downgrade_sold_motorcycle(mocker):
    mocker.patch('payments.utils.webhook_handlers.send_bike_customer_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_bike_admin_new_order')
    order = BikeOrderFactory(
        motorcycle__status='sold',
        deposit_amount='500.00',
    )
    Payment.objects.create(
        bike_order=order,
        stripe_payment_intent_id='pi_bike_already_sold',
        amount='500.00',
    )

    handle_payment_intent_succeeded({'id': 'pi_bike_already_sold'})

    order.motorcycle.refresh_from_db()
    assert order.motorcycle.status == 'sold'
