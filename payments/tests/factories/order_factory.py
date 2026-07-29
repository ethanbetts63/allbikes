import factory
from factory.django import DjangoModelFactory
from faker import Faker

from inventory.models import BikeOrder
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from product.models import ProductOrder
from product.tests.factories.product_factory import ProductFactory

fake = Faker('en_AU')
AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']


class ProductOrderFactory(DjangoModelFactory):
    class Meta:
        model = ProductOrder

    product = factory.SubFactory(ProductFactory)
    customer_name = factory.Sequence(lambda n: f'Test Customer {n}')
    customer_email = factory.LazyFunction(fake.email)
    customer_phone = '0400000000'
    address_line1 = factory.LazyFunction(fake.street_address)
    address_line2 = ''
    suburb = 'Perth'
    state = 'WA'
    postcode = '6000'
    unit_price_incl_gst = factory.LazyAttribute(lambda obj: obj.product.price)
    total = factory.LazyAttribute(lambda obj: obj.unit_price_incl_gst)
    status = 'pending_payment'
    terms_accepted = True


class BikeOrderFactory(DjangoModelFactory):
    class Meta:
        model = BikeOrder

    motorcycle = factory.SubFactory(MotorcycleFactory, condition='new', status='for_sale')
    selected_colour = ''
    customer_name = factory.Sequence(lambda n: f'Test Customer {n}')
    customer_email = factory.LazyFunction(fake.email)
    customer_phone = '0400000000'
    deposit_amount = '500.00'
    status = 'pending_payment'
    terms_accepted = True


# Transitional test aliases for notification tests; runtime code has no mixed Order type.
OrderFactory = ProductOrderFactory
MotorcycleOrderFactory = BikeOrderFactory
