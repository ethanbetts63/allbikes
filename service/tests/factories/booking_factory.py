import factory
from factory.django import DjangoModelFactory
from datetime import date, time
from service.models import Booking


class BookingFactory(DjangoModelFactory):
    class Meta:
        model = Booking

    drop_off_date = factory.LazyFunction(date.today)
    drop_off_time = time(9, 0)
    customer_name = factory.Sequence(lambda n: f"Customer {n}")
    customer_phone = "0400000000"
    customer_email = factory.Sequence(lambda n: f"customer{n}@example.com")
    make = "Vespa"
    model = "GTS 300"
    year = "2016"
    registration = "1ABC234"
    job_description = "Tyre fitting"
    status = Booking.Status.NOT_STARTED
    source = Booking.Source.MANUAL
