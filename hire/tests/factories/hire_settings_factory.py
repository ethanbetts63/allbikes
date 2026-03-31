import factory
from factory.django import DjangoModelFactory

from hire.models import HireSettings


class HireSettingsFactory(DjangoModelFactory):
    class Meta:
        model = HireSettings
        # Singleton — always creates/updates pk=1
        django_get_or_create = ('pk',)

    pk = 1
    bond_amount = '500.00'
    advance_min_days = 1
    advance_max_days = 90
    weekly_discount_percent = 15
    monthly_discount_percent = 25
