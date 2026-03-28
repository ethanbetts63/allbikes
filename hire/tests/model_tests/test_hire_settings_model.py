import pytest

from hire.models import HireSettings
from hire.tests.factories.hire_settings_factory import HireSettingsFactory


@pytest.mark.django_db
class TestHireSettingsModel:

    def test_save_forces_pk_1(self):
        """
        GIVEN a new HireSettings instance
        WHEN saved
        THEN its pk is always 1.
        """
        settings = HireSettingsFactory()
        assert settings.pk == 1

    def test_multiple_saves_result_in_one_row(self):
        """
        GIVEN two HireSettings saves
        WHEN both are committed
        THEN only one row exists in the database.
        """
        HireSettingsFactory(bond_amount='100.00')
        HireSettingsFactory(bond_amount='200.00')
        assert HireSettings.objects.count() == 1

    def test_get_creates_default_if_not_exists(self):
        """
        GIVEN no HireSettings row in the database
        WHEN HireSettings.get() is called
        THEN a row is created with default values and returned.
        """
        assert HireSettings.objects.count() == 0
        settings = HireSettings.get()
        assert settings.pk == 1
        assert HireSettings.objects.count() == 1

    def test_get_returns_existing_settings(self):
        """
        GIVEN an existing HireSettings row with custom values
        WHEN HireSettings.get() is called
        THEN the existing row is returned, not a new one.
        """
        HireSettingsFactory(bond_amount='750.00', advance_min_days=2)
        settings = HireSettings.get()
        assert str(settings.bond_amount) == '750.00'
        assert settings.advance_min_days == 2
        assert HireSettings.objects.count() == 1
