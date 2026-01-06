import factory
from factory.django import DjangoModelFactory
from faker import Faker
from inventory.models import Motorcycle
from datetime import date

fake = Faker()

class MotorcycleFactory(DjangoModelFactory):
    class Meta:
        model = Motorcycle
        skip_postgeneration_save = True

    make = factory.LazyFunction(fake.company)
    model = factory.LazyFunction(fake.word)
    year = factory.LazyFunction(lambda: int(fake.year()))
    price = factory.LazyFunction(lambda: fake.pydecimal(left_digits=5, right_digits=2, positive=True))
    condition = factory.Iterator([choice[0] for choice in Motorcycle.CONDITION_CHOICES])
    status = factory.Iterator([choice[0] for choice in Motorcycle.STATUS_CHOICES])
    is_featured = factory.LazyFunction(fake.pybool)
    odometer = factory.LazyFunction(lambda: fake.pyint(min_value=0, max_value=100000))
    engine_size = factory.LazyFunction(lambda: fake.pyint(min_value=50, max_value=2000))
    range = factory.LazyFunction(lambda: fake.pyint(min_value=100, max_value=500))
    seats = factory.LazyFunction(lambda: fake.pyint(min_value=1, max_value=2))
    transmission = factory.Iterator([choice[0] for choice in Motorcycle.TRANSMISSION_CHOICES if choice[0] is not None])
    description = factory.LazyFunction(fake.paragraph)
    youtube_link = factory.LazyFunction(fake.url)
    rego = factory.LazyFunction(lambda: fake.license_plate())
    rego_exp = factory.LazyFunction(lambda: fake.future_date(end_date="+1y"))
    stock_number = factory.Sequence(lambda n: f"STOCK-{n+1:05d}")
    warranty_months = factory.LazyFunction(lambda: fake.pyint(min_value=0, max_value=24))

    @factory.post_generation
    def slug(self, create, extracted, **kwargs):
        if not create:
            return

        # The slug is generated on save, so we just need to save the object.
        # The factory's default creation strategy does this, but if we need to
        # re-save for any reason or ensure the slug is up-to-date after
        # changing fields, we can do it here.
        self.save()
