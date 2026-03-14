import pytest

from payments.serializers.order_serializer import OrderCreateSerializer, OrderSerializer, OrderStatusSerializer
from payments.tests.factories.order_factory import OrderFactory
from product.tests.factories.product_factory import ProductFactory


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
