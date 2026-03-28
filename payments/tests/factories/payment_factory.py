import factory
from decimal import Decimal
from factory.django import DjangoModelFactory

from payments.models import Payment
from payments.tests.factories.order_factory import OrderFactory


class PaymentFactory(DjangoModelFactory):
    class Meta:
        model = Payment

    order = factory.SubFactory(OrderFactory)
    hire_booking = None
    stripe_payment_intent_id = factory.Sequence(lambda n: f'pi_test_{n:010d}')
    amount = factory.LazyAttribute(
        lambda obj: obj.order.product.price if obj.order and obj.order.product else '550.00'
    )
    status = 'pending'


class HirePaymentFactory(DjangoModelFactory):
    """Payment linked to a HireBooking (order=None)."""

    class Meta:
        model = Payment

    order = None
    hire_booking = factory.SubFactory(
        'hire.tests.factories.hire_booking_factory.HireBookingFactory'
    )
    stripe_payment_intent_id = factory.Sequence(lambda n: f'pi_hire_{n:010d}')
    amount = factory.LazyAttribute(
        lambda obj: Decimal(str(obj.hire_booking.total_hire_amount)) + Decimal(str(obj.hire_booking.bond_amount))
    )
    status = 'pending'
