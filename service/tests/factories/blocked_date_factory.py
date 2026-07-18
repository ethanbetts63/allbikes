import factory
from factory.django import DjangoModelFactory
from datetime import date
from service.models import BlockedDate


class BlockedDateFactory(DjangoModelFactory):
    class Meta:
        model = BlockedDate
        django_get_or_create = ('date',)

    date = factory.LazyFunction(date.today)
    reason = ""
