import factory
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone
from factory.django import DjangoModelFactory

from notifications.models import Message
from payments.tests.factories.order_factory import ProductOrderFactory


class MessageFactory(DjangoModelFactory):
    class Meta:
        model = Message
        exclude = ['related_object']

    related_object = factory.SubFactory(ProductOrderFactory)
    content_type = factory.LazyAttribute(lambda o: ContentType.objects.get_for_model(o.related_object))
    object_id = factory.LazyAttribute(lambda o: o.related_object.pk)

    to = 'test@example.com'
    subject = 'Test subject'
    body_text = 'Test body'
    body_html = '<p>Test body</p>'
    message_type = 'customer_confirmation'
    channel = 'email'
    status = 'sent'
    provider_message_id = '<message-id@mailgun.test>'
    sent_at = factory.LazyFunction(timezone.now)
    error_message = ''
