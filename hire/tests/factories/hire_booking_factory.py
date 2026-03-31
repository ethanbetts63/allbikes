import factory
from factory.django import DjangoModelFactory
from faker import Faker
from datetime import date, timedelta

from hire.models import HireBooking
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

fake = Faker('en_AU')


class HireBookingFactory(DjangoModelFactory):
    class Meta:
        model = HireBooking

    motorcycle = factory.SubFactory(
        MotorcycleFactory,
        is_hire=True,
        status='for_sale',
        daily_rate='100.00',
    )
    hire_start = factory.LazyFunction(lambda: date.today() + timedelta(days=5))
    hire_end = factory.LazyFunction(lambda: date.today() + timedelta(days=7))
    effective_daily_rate = '100.00'
    total_hire_amount = '300.00'
    bond_amount = '500.00'
    customer_name = factory.LazyFunction(fake.name)
    customer_email = factory.LazyFunction(fake.email)
    customer_phone = factory.LazyFunction(lambda: fake.phone_number()[:20])
    status = 'confirmed'
