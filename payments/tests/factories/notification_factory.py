import factory
from factory.django import DjangoModelFactory

from payments.models import Notification
from payments.tests.factories.order_factory import OrderFactory


class NotificationFactory(DjangoModelFactory):
    class Meta:
        model = Notification

    order = factory.SubFactory(OrderFactory)
    notification_type = 'customer_confirmation'
    status = 'sent'
