import pytest

from payments.models import Notification
from payments.tests.factories.notification_factory import NotificationFactory
from payments.tests.factories.order_factory import OrderFactory


@pytest.mark.django_db
class TestNotificationModel:

    def test_str(self):
        """
        GIVEN a saved Notification
        WHEN str() is called
        THEN it returns a readable summary.
        """
        order = OrderFactory()
        notification = NotificationFactory(
            order=order,
            notification_type='customer_confirmation',
            status='sent',
        )
        assert order.order_reference in str(notification)
        assert 'customer_confirmation' in str(notification)
        assert 'sent' in str(notification)

    def test_default_status_is_pending(self):
        """
        GIVEN a Notification created without an explicit status
        WHEN inspecting the status field
        THEN it defaults to 'pending'.
        """
        order = OrderFactory()
        notification = Notification.objects.create(
            order=order,
            notification_type='admin_new_order',
        )
        assert notification.status == 'pending'

    def test_sent_at_is_nullable(self):
        """
        GIVEN a Notification with no sent_at value
        WHEN saved
        THEN sent_at is None and the record saves without error.
        """
        order = OrderFactory()
        notification = Notification.objects.create(
            order=order,
            notification_type='admin_reminder',
        )
        assert notification.sent_at is None

    def test_cascade_delete_with_order(self):
        """
        GIVEN an Order with associated Notifications
        WHEN the Order is deleted
        THEN all related Notifications are also deleted.
        """
        order = OrderFactory()
        NotificationFactory(order=order)
        NotificationFactory(order=order)

        order_pk = order.pk
        order.delete()

        assert Notification.objects.filter(order_id=order_pk).count() == 0
