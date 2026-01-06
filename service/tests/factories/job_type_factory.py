import factory
from factory.django import DjangoModelFactory
from faker import Faker
from service.models import JobType

fake = Faker()

class JobTypeFactory(DjangoModelFactory):
    class Meta:
        model = JobType
        django_get_or_create = ('name',)

    name = factory.LazyFunction(lambda: " ".join(fake.words(nb=3)).title())
    description = factory.LazyFunction(fake.paragraph)
