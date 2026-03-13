import re
import pytest

from payments.models import Order
from payments.tests.factories.order_factory import OrderFactory
from product.tests.factories.product_factory import ProductFactory


@pytest.mark.django_db
class TestOrderReferenceGeneration:
    """Tests for the auto-generated order_reference field."""

    def test_reference_is_auto_generated_on_save(self):
        """
        GIVEN a new Order with no order_reference
        WHEN the order is saved
        THEN order_reference is populated automatically.
        """
        order = OrderFactory()
        assert order.order_reference != ''

    def test_reference_matches_expected_format(self):
        """
        GIVEN a new Order
        WHEN saved
        THEN order_reference matches the SS-XXXXXXXX format (8 hex chars, uppercase).
        """
        order = OrderFactory()
        assert re.match(r'^SS-[0-9A-F]{8}$', order.order_reference)

    def test_reference_is_unique(self):
        """
        GIVEN two independently created Orders
        WHEN both are saved
        THEN they have different order references.
        """
        order_a = OrderFactory()
        order_b = OrderFactory()
        assert order_a.order_reference != order_b.order_reference

    def test_existing_reference_is_not_overwritten(self):
        """
        GIVEN an Order with a manually set order_reference
        WHEN saved again
        THEN the reference is preserved.
        """
        order = OrderFactory(order_reference='SS-AABBCCDD')
        order.status = 'paid'
        order.save()
        order.refresh_from_db()
        assert order.order_reference == 'SS-AABBCCDD'


@pytest.mark.django_db
class TestOrderDefaults:
    """Tests for default field values on Order."""

    def test_default_status_is_pending_payment(self):
        """
        GIVEN a newly created Order (with no explicit status)
        WHEN accessed
        THEN status defaults to 'pending_payment'.
        """
        product = ProductFactory()
        order = Order.objects.create(
            product=product,
            customer_name='Test User',
            customer_email='test@example.com',
            address_line1='1 Test St',
            suburb='Perth',
            state='WA',
            postcode='6000',
        )
        assert order.status == 'pending_payment'

    def test_str_returns_order_reference(self):
        """
        GIVEN an Order
        WHEN str() is called
        THEN it returns the order_reference.
        """
        order = OrderFactory()
        assert str(order) == order.order_reference
