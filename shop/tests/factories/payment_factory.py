import factory
from factory.django import DjangoModelFactory

from shop.models import Payment
from shop.tests.factories.order_factory import OrderFactory


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    order = factory.SubFactory(OrderFactory)
    stripe_payment_intent_id = factory.Sequence(lambda n: f'pi_test_{n:010d}')
    amount = factory.LazyAttribute(lambda obj: obj.order.product.price)
    status = 'pending'
