from unittest.mock import MagicMock, patch

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from data_management.tests.factories.user_factory import UserFactory
from inventory.models import BikeInterestEnquiry
from inventory.tests.factories.motorcycle_factory import MotorcycleFactory
from inventory.views.bike_interest_views import (
    GREETING,
    NEW_BIKE_COLOUR_QUESTION,
    NEW_BIKE_BODY,
    SIGN_OFF,
    USED_BIKE_BODY,
)
from notifications.models import Message


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_client():
    client = APIClient()
    client.force_authenticate(user=UserFactory(is_staff=True))
    return client


@pytest.fixture(autouse=True)
def reset_throttle_history():
    """Give each test a fresh throttle budget.

    DRF binds THROTTLE_RATES as a class attribute at import time, so overriding
    the rate via settings has no effect. The throttle counts against the anon
    IP in Django's cache, which persists for the whole test run — without this,
    tests silently start 429ing once the module has made enough requests.
    """
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestBikeInterestCreateView:
    def test_registers_interest(self, api_client):
        """
        GIVEN a bike
        WHEN an anonymous visitor submits their email
        THEN an enquiry is stored against that bike.
        """
        bike = MotorcycleFactory()
        response = api_client.post(
            reverse('inventory:bike-interest-create'),
            {'motorcycle': bike.id, 'email': 'Buyer@Example.com'},
            format='json',
        )

        assert response.status_code == status.HTTP_201_CREATED
        enquiry = BikeInterestEnquiry.objects.get()
        assert enquiry.motorcycle == bike
        assert enquiry.email == 'buyer@example.com'
        assert enquiry.responded_at is None

    def test_repeat_submission_is_idempotent(self, api_client):
        """
        GIVEN an existing enquiry
        WHEN the same person submits the same bike again
        THEN no second row is created and the response is 200 rather than 201.
        """
        bike = MotorcycleFactory()
        url = reverse('inventory:bike-interest-create')
        api_client.post(url, {'motorcycle': bike.id, 'email': 'buyer@example.com'}, format='json')
        response = api_client.post(url, {'motorcycle': bike.id, 'email': 'buyer@example.com'}, format='json')

        assert response.status_code == status.HTTP_200_OK
        assert BikeInterestEnquiry.objects.count() == 1

    def test_same_email_can_enquire_about_two_bikes(self, api_client):
        """
        GIVEN two bikes
        WHEN the same person enquires about both
        THEN both enquiries are stored.
        """
        url = reverse('inventory:bike-interest-create')
        for bike in MotorcycleFactory.create_batch(2):
            api_client.post(url, {'motorcycle': bike.id, 'email': 'buyer@example.com'}, format='json')

        assert BikeInterestEnquiry.objects.count() == 2

    def test_rejects_invalid_email(self, api_client):
        bike = MotorcycleFactory()
        response = api_client.post(
            reverse('inventory:bike-interest-create'),
            {'motorcycle': bike.id, 'email': 'not-an-email'},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert not BikeInterestEnquiry.objects.exists()

    def test_notifies_admin_by_email_and_sms(self, api_client, settings):
        """
        GIVEN a bike
        WHEN someone registers interest
        THEN admin gets both an email and an SMS, so a reply can go out fast.
        """
        settings.ADMIN_EMAILS = ['admin@example.com']
        bike = MotorcycleFactory()

        with patch('notifications.utils.email._send_admin_sms') as sms:
            api_client.post(
                reverse('inventory:bike-interest-create'),
                {'motorcycle': bike.id, 'email': 'buyer@example.com'},
                format='json',
            )

        message = Message.objects.get(message_type='bike_interest_admin_new')
        assert message.to == 'admin@example.com'
        assert 'buyer@example.com' in message.body_text
        assert str(bike) in message.subject
        sms.assert_called_once()
        assert 'buyer@example.com' in sms.call_args.args[0]

    def test_repeat_submission_does_not_re_notify_admin(self, api_client, settings):
        """
        GIVEN an existing enquiry
        WHEN the same person submits the same bike again
        THEN admin is not alerted a second time.
        """
        settings.ADMIN_EMAILS = ['admin@example.com']
        bike = MotorcycleFactory()
        url = reverse('inventory:bike-interest-create')
        payload = {'motorcycle': bike.id, 'email': 'buyer@example.com'}

        with patch('notifications.utils.email._send_admin_sms') as sms:
            api_client.post(url, payload, format='json')
            api_client.post(url, payload, format='json')

        assert Message.objects.filter(message_type='bike_interest_admin_new').count() == 1
        assert sms.call_count == 1

    def test_enquiry_is_still_saved_when_the_notification_fails(self, api_client, settings):
        """
        GIVEN admin notification is broken
        WHEN someone registers interest
        THEN the enquiry is still stored and the customer still sees success.

        The enquiry is the thing of value; a failed alert must not lose it.
        """
        settings.ADMIN_EMAILS = ['admin@example.com']
        bike = MotorcycleFactory()

        with patch(
            'inventory.views.bike_interest_views.send_bike_interest_admin_new',
            side_effect=Exception('twilio down'),
        ):
            response = api_client.post(
                reverse('inventory:bike-interest-create'),
                {'motorcycle': bike.id, 'email': 'buyer@example.com'},
                format='json',
            )

        assert response.status_code == status.HTTP_201_CREATED
        assert BikeInterestEnquiry.objects.filter(email='buyer@example.com').exists()

    def test_sms_still_sends_when_no_admin_email_is_configured(self, api_client, settings):
        """A missing ADMIN_EMAILS must not silently drop the SMS as well."""
        settings.ADMIN_EMAILS = []
        settings.ADMIN_EMAIL = ''
        bike = MotorcycleFactory()

        with patch('notifications.utils.email._send_admin_sms') as sms:
            api_client.post(
                reverse('inventory:bike-interest-create'),
                {'motorcycle': bike.id, 'email': 'buyer@example.com'},
                format='json',
            )

        assert not Message.objects.filter(message_type='bike_interest_admin_new').exists()
        sms.assert_called_once()

    def test_is_rate_limited(self, api_client):
        """
        GIVEN the public, unauthenticated form
        WHEN one client submits far more than the hourly allowance
        THEN it is throttled, so the endpoint cannot be used to bulk-enrol
             addresses or spam admin with notifications.
        """
        bikes = MotorcycleFactory.create_batch(12)
        url = reverse('inventory:bike-interest-create')

        statuses = [
            api_client.post(
                url, {'motorcycle': bike.id, 'email': f'buyer{index}@example.com'}, format='json'
            ).status_code
            for index, bike in enumerate(bikes)
        ]

        assert status.HTTP_429_TOO_MANY_REQUESTS in statuses

    def test_rejects_unknown_bike(self, api_client):
        response = api_client.post(
            reverse('inventory:bike-interest-create'),
            {'motorcycle': 999999, 'email': 'buyer@example.com'},
            format='json',
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestAdminBikeInterestListView:
    def test_requires_staff(self, api_client):
        response = api_client.get(reverse('inventory:admin-bike-interest-list'))
        assert response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_lists_enquiries_with_response_state(self, admin_client):
        """
        GIVEN one answered and one unanswered enquiry
        WHEN staff list the enquiries
        THEN each row reports whether it has been responded to.
        """
        bike = MotorcycleFactory()
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='waiting@example.com')
        answered = BikeInterestEnquiry.objects.create(motorcycle=bike, email='answered@example.com')
        answered.responded_at = '2026-01-01T00:00:00Z'
        answered.save()

        response = admin_client.get(reverse('inventory:admin-bike-interest-list'))

        assert response.status_code == status.HTTP_200_OK
        by_email = {row['email']: row for row in response.data['enquiries']}
        assert by_email['waiting@example.com']['responded'] is False
        assert by_email['answered@example.com']['responded'] is True
        assert by_email['waiting@example.com']['motorcycle_title'] == str(bike)

    def test_returns_a_slug_rather_than_an_absolute_url(self, admin_client):
        """
        GIVEN an enquiry
        WHEN staff list the enquiries
        THEN the bike is identified by slug, so the dashboard can build a link
             relative to whichever environment it is running in.
        """
        bike = MotorcycleFactory()
        BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        response = admin_client.get(reverse('inventory:admin-bike-interest-list'))

        row = response.data['enquiries'][0]
        assert row['motorcycle_slug'] == bike.slug
        assert 'listing_url' not in row


@pytest.mark.django_db
class TestAdminBikeInterestReplyView:
    def test_requires_staff(self, api_client):
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')
        url = reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        assert api_client.get(url).status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)

    def test_draft_is_addressed_to_the_enquirer_and_names_the_bike(self, admin_client):
        """
        GIVEN an enquiry
        WHEN staff open the reply draft
        THEN the recipient is the enquirer and the body names the bike.
        """
        bike = MotorcycleFactory(make='Sym', model='Crox')
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        response = admin_client.get(reverse('inventory:admin-bike-interest-reply', args=[enquiry.id]))

        assert response.status_code == status.HTTP_200_OK
        assert response.data['to'] == 'buyer@example.com'
        assert 'Sym Crox' in response.data['subject']
        assert 'Sym Crox' in response.data['body']

    @pytest.mark.parametrize('condition', ['new', 'used'])
    def test_draft_links_to_the_bike_with_an_absolute_url(self, admin_client, settings, condition):
        """
        GIVEN an enquiry
        WHEN staff open the reply draft
        THEN it links the listing absolutely — the customer reads this in an
             email client, where a relative URL would be dead.
        """
        settings.SITE_URL = 'https://example.test'
        bike = MotorcycleFactory(condition=condition)
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        body = admin_client.get(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        ).data['body']

        assert f'https://example.test/inventory/motorcycles/{bike.slug}' in body

    def test_new_bike_draft_asks_which_colour_and_lists_the_options(self, admin_client):
        """
        GIVEN a new bike with colour options
        WHEN staff open the reply draft
        THEN it asks which colour they want and names every option.

        Asserts on the assembled shape rather than the exact sentences, so the
        copy constants can be reworded without breaking the test.
        """
        bike = MotorcycleFactory(condition='new', available_colours=['red', 'white', 'blue'])
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        body = admin_client.get(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        ).data['body']

        assert 'red, white and blue' in body
        assert body.startswith(GREETING)
        assert body.endswith(SIGN_OFF)
        assert USED_BIKE_BODY not in body

    def test_new_bike_draft_drops_only_the_colour_question_when_none_are_set(self, admin_client):
        """
        GIVEN a new bike with no colours configured
        WHEN staff open the reply draft
        THEN the colour question is omitted but the rest of the body remains.
        """
        bike = MotorcycleFactory(condition='new', available_colours=[])
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        body = admin_client.get(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        ).data['body']

        assert NEW_BIKE_BODY in body
        assert 'The options are' not in body

    def test_new_bike_draft_reads_naturally_with_a_single_colour(self, admin_client):
        """One colour must not produce a dangling "and"."""
        bike = MotorcycleFactory(condition='new', available_colours=['red'])
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        body = admin_client.get(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        ).data['body']

        assert NEW_BIKE_COLOUR_QUESTION.format(options='red') in body

    @pytest.mark.parametrize('condition', ['used', 'demo'])
    def test_used_bike_draft_invites_a_look_and_never_mentions_colours(self, admin_client, condition):
        """
        GIVEN a used or demo bike
        WHEN staff open the reply draft
        THEN it points at the bike in the shop rather than a supplier order.
        """
        bike = MotorcycleFactory(condition=condition, available_colours=['red'])
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        body = admin_client.get(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])
        ).data['body']

        assert USED_BIKE_BODY in body
        assert 'The options are' not in body
        assert NEW_BIKE_BODY not in body

    def test_draft_404s_for_unknown_enquiry(self, admin_client):
        response = admin_client.get(reverse('inventory:admin-bike-interest-reply', args=[999999]))
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_sending_marks_the_enquiry_responded_and_records_the_message(self, admin_client):
        """
        GIVEN an unanswered enquiry
        WHEN staff send a reply
        THEN the enquiry is marked responded and the exact copy is audited.
        """
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        response = admin_client.post(
            reverse('inventory:admin-bike-interest-reply', args=[enquiry.id]),
            {'subject': 'About the bike', 'body': 'Hi, it is still available.'},
            format='json',
        )

        assert response.status_code == status.HTTP_200_OK
        enquiry.refresh_from_db()
        assert enquiry.responded_at is not None

        message = Message.objects.get(message_type='bike_interest_reply')
        assert message.to == 'buyer@example.com'
        assert message.subject == 'About the bike'
        assert message.body_text == 'Hi, it is still available.'
        assert message.status == 'sent'

    def test_rejects_empty_subject_or_body(self, admin_client):
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')
        url = reverse('inventory:admin-bike-interest-reply', args=[enquiry.id])

        assert admin_client.post(url, {'subject': '', 'body': 'text'}, format='json').status_code == 400
        assert admin_client.post(url, {'subject': 'subject', 'body': '  '}, format='json').status_code == 400
        enquiry.refresh_from_db()
        assert enquiry.responded_at is None

    def test_failed_send_leaves_enquiry_unanswered(self, admin_client):
        """
        GIVEN Mailgun is failing
        WHEN staff send a reply
        THEN the enquiry stays red so the send can be retried.
        """
        bike = MotorcycleFactory()
        enquiry = BikeInterestEnquiry.objects.create(motorcycle=bike, email='buyer@example.com')

        failing = MagicMock(side_effect=Exception('mailgun down'))
        with patch('notifications.utils.email.requests.post', failing):
            response = admin_client.post(
                reverse('inventory:admin-bike-interest-reply', args=[enquiry.id]),
                {'subject': 'About the bike', 'body': 'Hi.'},
                format='json',
            )

        assert response.status_code == 502
        enquiry.refresh_from_db()
        assert enquiry.responded_at is None
        assert Message.objects.get(message_type='bike_interest_reply').status == 'failed'
