import factory
from factory.django import DjangoModelFactory

from payments.models import Payment
from payments.tests.factories.order_factory import ProductOrderFactory


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    product_order = factory.SubFactory(ProductOrderFactory)
    stripe_payment_intent_id = factory.Sequence(lambda n: f'pi_test_{n:010d}')
    amount = factory.LazyAttribute(lambda obj: obj.product_order.total)
    status = 'pending'


class HirePaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    product_order = None
    hire_booking = factory.SubFactory(
        'hire.tests.factories.hire_booking_factory.HireBookingFactory'
    )
    stripe_payment_intent_id = factory.Sequence(lambda n: f'pi_hire_{n:010d}')
    amount = factory.LazyAttribute(lambda obj: obj.hire_booking.total_charged)
    status = 'pending'
