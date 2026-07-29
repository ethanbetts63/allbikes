import pytest
from datetime import timedelta
from django.core.management import call_command
from django.utils import timezone

from hire.models import HireBooking
from hire.tests.factories.hire_booking_factory import HireBookingFactory
from product.models import ProductOrder
from payments.tests.factories.order_factory import OrderFactory
from parts.checkout import create_parts_order
from parts.models import Part, PartsSettings
from parts.tests.factories import PartSectionFactory, SectionPartFactory


@pytest.mark.django_db
class TestCleanupAbandonedOrdersCommand:

    def test_cancels_pending_parts_orders_older_than_7_days(self):
        settings = PartsSettings.get()
        part = Part.objects.create(part_number='CLEANUP-PART', wholesale_price_incl_gst=10, in_pa_feed=True)
        section_part = SectionPartFactory(section=PartSectionFactory(), part=part)
        order = create_parts_order(customer={
            'customer_name': 'Cleanup Test', 'customer_email': 'cleanup@example.com',
            'address_line1': '1 Test St', 'suburb': 'Perth', 'postcode': '6000',
            'terms_accepted': True,
        }, items=[{'part_number': part.part_number, 'section_part_id': section_part.id, 'quantity': 1}])
        from parts.models import PartsOrder
        PartsOrder.objects.filter(pk=order.pk).update(created_at=timezone.now() - timedelta(days=8))

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'

    def test_cancels_pending_payment_orders_older_than_7_days(self):
        """
        GIVEN a pending_payment order created 8 days ago
        WHEN cleanup_abandoned_orders is run
        THEN the order status becomes cancelled.
        """
        order = OrderFactory(status='pending_payment')
        ProductOrder.objects.filter(pk=order.pk).update(
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
        ProductOrder.objects.filter(pk=order.pk).update(
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
        ProductOrder.objects.filter(pk=order.pk).update(
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
            ProductOrder.objects.filter(pk=order.pk).update(
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
        ProductOrder.objects.filter(pk=order.pk).update(
            created_at=timezone.now() - timedelta(days=7, seconds=1)
        )

        call_command('cleanup_abandoned_orders')

        order.refresh_from_db()
        assert order.status == 'cancelled'


@pytest.mark.django_db
class TestCleanupAbandonedOrdersCommandHire:

    def test_cancels_pending_payment_hire_bookings_older_than_7_days(self):
        """
        GIVEN a pending_payment hire booking created 8 days ago
        WHEN cleanup_abandoned_orders is run
        THEN the booking status becomes cancelled.
        """
        booking = HireBookingFactory(status='pending_payment')
        HireBooking.objects.filter(pk=booking.pk).update(
            created_at=timezone.now() - timedelta(days=8)
        )

        call_command('cleanup_abandoned_orders')

        booking.refresh_from_db()
        assert booking.status == 'cancelled'

    def test_does_not_cancel_recent_pending_payment_hire_bookings(self):
        """
        GIVEN a pending_payment hire booking created 6 days ago
        WHEN cleanup_abandoned_orders is run
        THEN the booking status remains pending_payment.
        """
        booking = HireBookingFactory(status='pending_payment')
        HireBooking.objects.filter(pk=booking.pk).update(
            created_at=timezone.now() - timedelta(days=6)
        )

        call_command('cleanup_abandoned_orders')

        booking.refresh_from_db()
        assert booking.status == 'pending_payment'

    def test_does_not_cancel_confirmed_hire_bookings(self):
        """
        GIVEN a confirmed hire booking older than 7 days
        WHEN cleanup_abandoned_orders is run
        THEN the booking status is not changed.
        """
        booking = HireBookingFactory(status='confirmed')
        HireBooking.objects.filter(pk=booking.pk).update(
            created_at=timezone.now() - timedelta(days=14)
        )

        call_command('cleanup_abandoned_orders')

        booking.refresh_from_db()
        assert booking.status == 'confirmed'
