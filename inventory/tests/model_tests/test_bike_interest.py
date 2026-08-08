import pytest
from django.db import IntegrityError
from django.utils import timezone

from inventory.models import BikeInterestEnquiry
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory


@pytest.mark.django_db
class TestBikeInterestEnquiry:
    def test_email_is_normalised_on_save(self):
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='  Buyer@Example.COM ')
        assert enquiry.email == 'buyer@example.com'

    def test_duplicate_email_for_same_bike_is_rejected(self):
        """The unique constraint is what keeps re-submissions off the staff list."""
        bike = MotorcycleFactory()
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')
        with pytest.raises(IntegrityError):
            BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

    def test_responded_reflects_responded_at(self):
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')
        assert enquiry.responded is False

        enquiry.responded_at = timezone.now()
        assert enquiry.responded is True

    def test_deleting_the_bike_removes_its_enquiries(self):
        bike = MotorcycleFactory()
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')
        bike.delete()
        assert not BikeInterestEnquiry.objects.exists()

    def test_ordering_is_newest_first(self):
        bike = MotorcycleFactory()
        older = BikeInterestEnquiry.objects.create(motorcycle=bike, email='older@example.com')
        newer = BikeInterestEnquiry.objects.create(motorcycle=bike, email='newer@example.com')
        assert list(BikeInterestEnquiry.objects.all()) == [newer, older]
