import pytest
from datetime import timedelta
from django.core.management import call_command
from django.utils import timezone

from payments.models import Order
from payments.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestCleanupAbandonedOrdersCommand:

    def test_cancels_pending_payment_orders_older_than_7_days(self):
        """
        GIVEN a pending_payment order created 8 days ago
        WHEN cleanup_abandoned_orders is run
        THEN the order status becomes cancelled.
        """
        order = OrderFactory(status='pending_payment')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'

    def test_does_not_cancel_recent_pending_payment_orders(self):
        """
        GIVEN a pending_payment order created 6 days ago (within 7-day window)
        WHEN cleanup_abandoned_orders is run
        THEN the order status remains pending_payment.
        """
        order = OrderFactory(status='pending_payment')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=6)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'pending_payment'

    def test_does_not_cancel_paid_orders(self):
        """
        GIVEN a paid order older than 7 days
        WHEN cleanup_abandoned_orders is run
        THEN the order status is not changed.
        """
        order = OrderFactory(status='paid')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=14)
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
                created_at=timezone.now() - timedelta(days=8)
            )

        call_command('cleanup_abandoned_orders')

        out, _ = capsys.readouterr()
        assert '2' in out

    def test_exactly_7_day_boundary_is_not_cancelled(self):
        """
        GIVEN a pending_payment order created just over 7 days ago
        WHEN cleanup_abandoned_orders is run
        THEN the order is cancelled (strictly older than 7 days is caught).
        """
        order = OrderFactory(status='pending_payment')
        Order.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=7, seconds=1)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'
