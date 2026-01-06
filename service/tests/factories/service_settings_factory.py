import factory
from factory.django import DjangoModelFactory
from service.models import ServiceSettings
from datetime import time

class ServiceSettingsFactory(DjangoModelFactory):
    class Meta:
        model = ServiceSettings
        django_get_or_create = ('pk',)

    pk = 1
    booking_advance_notice = 2
    drop_off_start_time = time(9, 0)
    drop_off_end_time = time(17, 0)
