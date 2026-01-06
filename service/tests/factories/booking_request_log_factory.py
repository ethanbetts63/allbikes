import factory
from factory.django import DjangoModelFactory
from faker import Faker
from service.models import BookingRequestLog

fake = Faker()

class BookingRequestLogFactory(DjangoModelFactory):
    class Meta:
        model = BookingRequestLog

    customer_name = factory.LazyFunction(fake.name)
    customer_email = factory.LazyFunction(fake.email)
    vehicle_registration = factory.LazyFunction(lambda: fake.bothify(text='??####??').upper())
    request_payload = factory.LazyFunction(lambda: {'data': fake.pydict(nb_elements=5, variable_nb_elements=True, value_types=['str', 'int', 'float', 'bool'])})
    response_status_code = factory.LazyFunction(lambda: fake.random_element(elements=[200, 201, 400, 500]))
    response_body = factory.LazyFunction(lambda: {'data': fake.pydict(nb_elements=3, variable_nb_elements=True, value_types=['str'])})
    status = factory.LazyFunction(lambda: fake.random_element(elements=['Success', 'Failed']))
