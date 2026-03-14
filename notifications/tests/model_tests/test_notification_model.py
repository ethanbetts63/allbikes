import pytest
from django.contrib.contenttypes.models import ContentType

from notifications.models import Message
from notifications.tests.factories.notification_factory import MessageFactory
from payments.tests.factories.order_factory import OrderFactory


def _messages_for(obj, **kwargs):
    ct = ContentType.objects.get_for_model(obj)
    return Message.objects.filter(content_type=ct, object_id=obj.pk, **kwargs)


@pytest.mark.django_db
class TestMessageModel:

    def test_str(self):
        msg = MessageFactory(message_type='customer_confirmation', status='sent')
        result = str(msg)
        assert 'customer_confirmation' in result
        assert 'sent' in result

    def test_content_object_round_trips(self):
        order = OrderFactory()
        msg = MessageFactory(related_object=order)
        msg.refresh_from_db()
        assert msg.content_object == order

    def test_stores_email_content(self):
        msg = MessageFactory(
            to='customer@example.com',
            subject='Order confirmed — SS-ABC123',
            body_html='<h1>Confirmed</h1>',
            body_text='Confirmed',
        )
        msg.refresh_from_db()
        assert msg.to == 'customer@example.com'
        assert msg.subject == 'Order confirmed — SS-ABC123'
        assert msg.body_html == '<h1>Confirmed</h1>'

    def test_failed_message_stores_error(self):
        msg = MessageFactory(status='failed', error_message='Connection timeout', sent_at=None)
        assert msg.status == 'failed'
        assert msg.error_message == 'Connection timeout'
        assert msg.sent_at is None

    def test_audit_record_survives_order_delete(self):
        """
        GIVEN a Message linked to an Order
        WHEN the Order is deleted
        THEN the Message persists and content_object resolves to None.
        """
        order = OrderFactory()
        msg = MessageFactory(related_object=order)
        msg_pk = msg.pk

        order.delete()

        msg.refresh_from_db()
        assert Message.objects.filter(pk=msg_pk).exists()
        assert msg.content_object is None

