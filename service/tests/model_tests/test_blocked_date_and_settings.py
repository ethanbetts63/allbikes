import pytest
from datetime import date
from django.db import IntegrityError
from service.models import BlockedDate
from service.tests.factories import BlockedDateFactory, ServiceSettingsFactory


@pytest.mark.django_db
class TestBlockedDateModel:
    def test_unique_date(self):
        BlockedDateFactory(date=date(2026, 1, 1))
        with pytest.raises(IntegrityError):
            BlockedDate.objects.create(date=date(2026, 1, 1))


@pytest.mark.django_db
class TestServiceSettingsWeekdays:
    def test_parses_weekday_csv(self):
        settings = ServiceSettingsFactory(always_blocked_weekdays="0, 6")
        assert settings.get_always_blocked_weekdays() == {0, 6}

    def test_ignores_junk(self):
        settings = ServiceSettingsFactory(always_blocked_weekdays="")
        assert settings.get_always_blocked_weekdays() == set()

    def test_new_field_defaults(self):
        settings = ServiceSettingsFactory()
        assert settings.use_mechanic_desk_blocked_dates is True
        assert settings.reminder_emails_enabled is False
        assert settings.reminder_days_before == 1
