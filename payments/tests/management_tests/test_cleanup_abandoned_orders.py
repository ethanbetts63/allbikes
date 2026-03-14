import pytest
from datetime import timedelta
from django.core.management import call_command
from django.utils import timezone

from payments.models import Order
from payments.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestCleanupAbandonedOrdersCommand:

    def test_cancels_pending_payment_orders_older_than_24h(self):
        """
        GIVEN a pending_payment order created 25 hours ago
        WHEN cleanup_abandoned_orders is run
        THEN the order status becomes cancelled.
        """
        order = OrderFactory(status='pending_payment')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(hours=25)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'

    def test_does_not_cancel_recent_pending_payment_orders(self):
        """
        GIVEN a pending_payment order created 23 hours ago (within 24h window)
        WHEN cleanup_abandoned_orders is run
        THEN the order status remains pending_payment.
        """
        order = OrderFactory(status='pending_payment')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(hours=23)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'pending_payment'

    def test_does_not_cancel_paid_orders(self):
        """
        GIVEN a paid order older than 24 hours
        WHEN cleanup_abandoned_orders is run
        THEN the order status is not changed.
        """
        order = OrderFactory(status='paid')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(hours=48)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'paid'

    def test_outputs_count(self, capsys):
        """
        GIVEN two abandoned orders
        WHEN cleanup_abandoned_orders is run
        THEN stdout reports the number cancelled.
        """
        for _ in range(2):
            order = OrderFactory(status='pending_payment')
            Order.objects.filter(pk=order.pk).update(
                created_at=timezone.now() - timedelta(hours=25)
            )

        call_command('cleanup_abandoned_orders')

        out, _ = capsys.readouterr()
        assert '2' in out

    def test_exactly_24h_boundary_is_not_cancelled(self):
        """
        GIVEN a pending_payment order created exactly 24 hours ago (cutoff is strictly less than)
        WHEN cleanup_abandoned_orders is run
        THEN the order is not cancelled (boundary: created_at must be strictly before cutoff).
        """
        order = OrderFactory(status='pending_payment')
        # Set to just over 24h to ensure it IS caught, confirming the < boundary
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(hours=24, seconds=1)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'
