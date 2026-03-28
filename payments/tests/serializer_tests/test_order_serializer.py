import pytest

from payments.serializers.order_serializer import OrderCreateSerializer, OrderSerializer, OrderStatusSerializer
from payments.tests.factories.order_factory import OrderFactory
from product.tests.factories.product_factory import ProductFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


@pytest.mark.django_db
class TestOrderCreateSerializer:
    """Tests for OrderCreateSerializer validation."""

    def _valid_payload(self, product_id):
        return {
            'product': product_id,
            'customer_name': 'Jane Smith',
            'customer_email': 'jane@example.com',
            'customer_phone': '0400000000',
            'address_line1': '123 Test St',
            'address_line2': '',
            'suburb': 'Perth',
            'state': 'WA',
            'postcode': '6000',
            'terms_accepted': True,
        }

    def test_valid_payload_is_valid(self):
        """
        GIVEN a fully populated valid payload
        WHEN validated
        THEN the serializer is valid.
        """
        product = ProductFactory()
        serializer = OrderCreateSerializer(data=self._valid_payload(product.id))
        assert serializer.is_valid(), serializer.errors

    def test_missing_required_field_is_invalid(self):
        """
        GIVEN a payload missing customer_name
        WHEN validated
        THEN the serializer is invalid.
        """
        product = ProductFactory()
        data = self._valid_payload(product.id)
        del data['customer_name']
        serializer = OrderCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'customer_name' in serializer.errors

    def test_invalid_email_is_invalid(self):
        """
        GIVEN a payload with a malformed email
        WHEN validated
        THEN the serializer is invalid.
        """
        product = ProductFactory()
        data = self._valid_payload(product.id)
        data['customer_email'] = 'not-an-email'
        serializer = OrderCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'customer_email' in serializer.errors

    def test_nonexistent_product_is_invalid(self):
        """
        GIVEN a payload referencing a product pk that does not exist
        WHEN validated
        THEN the serializer is invalid.
        """
        serializer = OrderCreateSerializer(data=self._valid_payload(99999))
        assert not serializer.is_valid()
        assert 'product' in serializer.errors

    def test_product_order_requires_address(self):
        """
        GIVEN a product order payload missing address_line1
        WHEN validated
        THEN the serializer is invalid.
        """
        product = ProductFactory()
        data = self._valid_payload(product.id)
        del data['address_line1']
        serializer = OrderCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'address_line1' in serializer.errors

    def test_deposit_order_requires_phone(self):
        """
        GIVEN a deposit order payload with no customer_phone
        WHEN validated
        THEN the serializer is invalid — admin needs to call the customer.
        """
        motorcycle = MotorcycleFactory(condition='new', status='for_sale')
        data = {
            'motorcycle': motorcycle.id,
            'customer_name': 'Jane Smith',
            'customer_email': 'jane@example.com',
            'customer_phone': '',
            'terms_accepted': True,
        }
        serializer = OrderCreateSerializer(data=data)
        assert not serializer.is_valid()
        assert 'customer_phone' in serializer.errors

    def test_deposit_order_does_not_require_address(self):
        """
        GIVEN a deposit order payload with no address fields
        WHEN validated
        THEN the serializer is valid — pickup is arranged separately.
        """
        motorcycle = MotorcycleFactory(condition='new', status='for_sale')
        data = {
            'motorcycle': motorcycle.id,
            'customer_name': 'Jane Smith',
            'customer_email': 'jane@example.com',
            'customer_phone': '0400000000',
            'terms_accepted': True,
        }
        serializer = OrderCreateSerializer(data=data)
        assert serializer.is_valid(), serializer.errors


@pytest.mark.django_db
class TestOrderSerializer:
    """Tests for OrderSerializer output fields."""

    def test_includes_product_name(self):
        """
        GIVEN an Order
        WHEN serialized
        THEN product_name matches the related product's name.
        """
        order = OrderFactory()
        data = OrderSerializer(order).data
        assert data['product_name'] == order.product.name

    def test_amount_paid_is_none_before_payment(self):
        """
        GIVEN an Order that hasn't been paid yet
        WHEN serialized
        THEN amount_paid is None.
        """
        order = OrderFactory(amount_paid=None)
        data = OrderSerializer(order).data
        assert data['amount_paid'] is None

    def test_amount_paid_is_returned_after_payment(self):
        """
        GIVEN an Order with amount_paid set by the webhook
        WHEN serialized
        THEN amount_paid matches the recorded value.
        """
        order = OrderFactory(amount_paid='1200.00')
        data = OrderSerializer(order).data
        assert float(data['amount_paid']) == 1200.00


@pytest.mark.django_db
class TestOrderStatusSerializer:
    """Tests for OrderStatusSerializer."""

    def test_valid_status_is_valid(self):
        """
        GIVEN a valid status value
        WHEN validated
        THEN the serializer is valid.
        """
        order = OrderFactory()
        serializer = OrderStatusSerializer(order, data={'status': 'paid'})
        assert serializer.is_valid()

    def test_invalid_status_is_invalid(self):
        """
        GIVEN an unrecognised status value
        WHEN validated
        THEN the serializer is invalid.
        """
        order = OrderFactory()
        serializer = OrderStatusSerializer(order, data={'status': 'made_up_status'})
        assert not serializer.is_valid()
        assert 'status' in serializer.errors
