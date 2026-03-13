import factory
from factory.django import DjangoModelFactory
from faker import Faker

from product.models import Product

fake = Faker()


class ProductFactory(DjangoModelFactory):
    class Meta:
        model = Product
        skip_postgeneration_save = True

    name = factory.LazyFunction(lambda: fake.sentence(nb_words=3).rstrip("."))
    brand = factory.LazyFunction(lambda: fake.company())
    description = factory.LazyFunction(fake.paragraph)
    price = factory.LazyFunction(
        lambda: fake.pydecimal(left_digits=4, right_digits=2, positive=True, min_value=500, max_value=5000)
    )
    stock_quantity = 5
    is_active = True

    @factory.post_generation
    def slug(self, create, extracted, **kwargs):
        if not create:
            return
        self.save()
