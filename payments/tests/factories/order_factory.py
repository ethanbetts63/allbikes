import factory
from factory.django import DjangoModelFactory
from faker import Faker

from payments.models import Order
from product.tests.factories.product_factory import ProductFactory
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

fake = Faker('en_AU')

AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']


class OrderFactory(DjangoModelFactory):
    class Meta:
        model = Order

    product = factory.SubFactory(ProductFactory)
    customer_name = factory.LazyFunction(fake.name)
    customer_email = factory.LazyFunction(fake.email)
    customer_phone = factory.LazyFunction(lambda: fake.phone_number()[:20])
    address_line1 = factory.LazyFunction(fake.street_address)
    address_line2 = ''
    suburb = factory.LazyFunction(fake.city)
    state = factory.Iterator(AU_STATES)
    postcode = factory.LazyFunction(lambda: fake.postcode()[:4])
    status = 'pending_payment'


class MotorcycleOrderFactory(DjangoModelFactory):
    """Factory for deposit orders linked to a motorcycle."""

    class Meta:
        model = Order

    product = None
    motorcycle = factory.SubFactory(MotorcycleFactory, condition='new', status='for_sale')
    payment_type = 'deposit'
    customer_name = factory.LazyFunction(fake.name)
    customer_email = factory.LazyFunction(fake.email)
    customer_phone = factory.LazyFunction(lambda: fake.phone_number()[:20])
    address_line1 = ''
    address_line2 = ''
    suburb = ''
    state = ''
    postcode = ''
    status = 'pending_payment'
