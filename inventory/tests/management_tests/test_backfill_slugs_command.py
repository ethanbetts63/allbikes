import pytest
from django.core.management import call_command
from inventory.models import Motorcycle
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory

@pytest.mark.django_db
class TestBackfillSlugsCommand:

    def test_backfills_slugs_for_motorcycles(self, capsys):
        # Create motorcycles without slugs
        # Since save() automatically adds slug, we need to manually unset it and update
        moto1 = MotorcycleFactory()
        moto1.slug = None
        # Use update to bypass save() method which might regenerate slug
        Motorcycle.objects.filter(pk=moto1.pk).update(slug=None)
        
        moto2 = MotorcycleFactory()
        Motorcycle.objects.filter(pk=moto2.pk).update(slug=None)
        
        assert Motorcycle.objects.filter(slug__isnull=True).count() == 2
        
        call_command('backfill_slugs')
        
        captured = capsys.readouterr()
        assert "Found 2 motorcycles without a slug" in captured.out
        assert "Successfully updated 2 motorcycles" in captured.out
        
        # Verify slugs are populated
        moto1.refresh_from_db()
        moto2.refresh_from_db()
        assert moto1.slug is not None
        assert moto2.slug is not None

    def test_handles_no_motorcycles_needing_update(self, capsys):
        # Create a motorcycle with a slug
        MotorcycleFactory()
        
        call_command('backfill_slugs')
        
        captured = capsys.readouterr()
        assert "All motorcycles already have slugs. No action needed." in captured.out
