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

    def test_includes_product_price(self):
        """
        GIVEN an Order
        WHEN serialized
        THEN product_price matches the related product's price.
        """
        order = OrderFactory()
        data = OrderSerializer(order).data
        assert float(data['product_price']) == float(order.product.price)

    def test_discount_price_is_none_when_not_set(self):
        """
        GIVEN an Order whose product has no discount_price
        WHEN serialized
        THEN product_discount_price is None.
        """
        product = ProductFactory(discount_price=None)
        order = OrderFactory(product=product)
        data = OrderSerializer(order).data
        assert data['product_discount_price'] is None

    def test_discount_price_is_returned_when_set(self):
        """
        GIVEN an Order whose product has a discount_price
        WHEN serialized
        THEN product_discount_price contains the correct value as a string.
        """
        product = ProductFactory(discount_price='999.00')
        order = OrderFactory(product=product)
        data = OrderSerializer(order).data
        assert float(data['product_discount_price']) == 999.00


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
