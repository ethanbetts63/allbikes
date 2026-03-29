import factory
from factory.django import DjangoModelFactory

from hire.models import HireExtra


class HireExtraFactory(DjangoModelFactory):
    class Meta:
        model = HireExtra

    name = factory.Sequence(lambda n: f'Extra {n}')
    price_per_day = '25.00'
    is_active = True
