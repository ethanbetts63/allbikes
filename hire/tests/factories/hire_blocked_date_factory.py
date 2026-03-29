import factory
from factory.django import DjangoModelFactory
from datetime import date, timedelta

from hire.models import HireBlockedDate


class HireBlockedDateFactory(DjangoModelFactory):
    class Meta:
        model = HireBlockedDate

    date_from = factory.LazyFunction(lambda: date.today() + timedelta(days=10))
    date_to = factory.LazyFunction(lambda: date.today() + timedelta(days=12))
    reason = 'Test closure'
    motorcycle = None
