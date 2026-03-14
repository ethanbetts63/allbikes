import pytest
from django.contrib.contenttypes.models import ContentType

from notifications.models import Notification
from notifications.tests.factories.notification_factory import NotificationFactory
from payments.tests.factories.order_factory import OrderFactory


def _notifs_for(obj):
    ct = ContentType.objects.get_for_model(obj)
    return Notification.objects.filter(content_type=ct, object_id=obj.pk)


@pytest.mark.django_db
class TestNotificationModel:

    def test_str(self):
        """
        GIVEN a saved Notification
        WHEN str() is called
        THEN it includes notification_type, channel, and status.
        """
        notification = NotificationFactory(
            notification_type='customer_confirmation',
            channel='email',
            status='sent',
        )
        result = str(notification)
        assert 'customer_confirmation' in result
        assert 'email' in result
        assert 'sent' in result

    def test_content_object_round_trips(self):
        """
        GIVEN a Notification linked to an Order via GenericForeignKey
        WHEN content_object is accessed
        THEN it returns the original Order instance.
        """
        order = OrderFactory()
        notification = NotificationFactory(related_object=order)
        notification.refresh_from_db()
        assert notification.content_object == order

    def test_sent_at_is_nullable(self):
        """
        GIVEN a failed Notification with no sent_at
        WHEN saved
        THEN sent_at is None.
        """
        notification = NotificationFactory(status='failed', sent_at=None)
        assert notification.sent_at is None

    def test_cascade_delete_with_related_object(self):
        """
        GIVEN an Order with associated Notifications
        WHEN the Order is deleted
        THEN the Notification content_type FK cascades and the records are deleted.
        """
        order = OrderFactory()
        NotificationFactory(related_object=order)
        NotificationFactory(related_object=order)

        count_before = _notifs_for(order).count()
        assert count_before == 2

        order.delete()

        # After order deletion the content_type FK cascade removes notifications
        assert _notifs_for(order).count() == 0
