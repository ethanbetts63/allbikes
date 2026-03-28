import pytest

from payments.models import Payment
from payments.utils.webhook_handlers import handle_payment_intent_succeeded, handle_payment_intent_failed
from payments.tests.factories.payment_factory import HirePaymentFactory
from hire.models import HireBooking
from hire.tests.factories.hire_booking_factory import HireBookingFactory


def _intent(intent_id):
    return {'id': intent_id}


@pytest.fixture(autouse=True)
def mock_emails(mocker):
    mocker.patch('payments.utils.webhook_handlers.send_hire_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_admin_new_hire')
    mocker.patch('payments.utils.webhook_handlers.send_customer_confirmation')
    mocker.patch('payments.utils.webhook_handlers.send_admin_new_order')


@pytest.mark.django_db
class TestHandlePaymentIntentSucceededHire:
    """Tests for the payment_intent.succeeded handler — hire booking branch."""

    def test_marks_payment_succeeded_and_booking_confirmed(self):
        """
        GIVEN a pending Payment linked to a pending_payment HireBooking
        WHEN the succeeded handler is called
        THEN Payment status becomes succeeded and HireBooking status becomes confirmed.
        """
        booking = HireBookingFactory(status='pending_payment')
        payment = HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_1',
            status='pending',
        )

        handle_payment_intent_succeeded(_intent('pi_hire_1'))

        payment.refresh_from_db()
        booking.refresh_from_db()
        assert payment.status == 'succeeded'
        assert booking.status == 'confirmed'

    def test_sends_hire_confirmation_emails(self, mocker):
        """
        GIVEN a pending Payment linked to a HireBooking
        WHEN the succeeded handler is called
        THEN send_hire_confirmation and send_admin_new_hire are each called once.
        """
        mock_confirm = mocker.patch('payments.utils.webhook_handlers.send_hire_confirmation')
        mock_admin = mocker.patch('payments.utils.webhook_handlers.send_admin_new_hire')

        booking = HireBookingFactory(status='pending_payment')
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_email',
            status='pending',
        )

        handle_payment_intent_succeeded(_intent('pi_hire_email'))

        mock_confirm.assert_called_once()
        mock_admin.assert_called_once()

    def test_does_not_call_order_emails_for_hire_payment(self, mocker):
        """
        GIVEN a Payment linked to a HireBooking
        WHEN the succeeded handler is called
        THEN send_customer_confirmation and send_admin_new_order are NOT called.
        """
        mock_order_confirm = mocker.patch('payments.utils.webhook_handlers.send_customer_confirmation')
        mock_order_admin = mocker.patch('payments.utils.webhook_handlers.send_admin_new_order')

        booking = HireBookingFactory(status='pending_payment')
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_no_order_email',
            status='pending',
        )

        handle_payment_intent_succeeded(_intent('pi_hire_no_order_email'))

        mock_order_confirm.assert_not_called()
        mock_order_admin.assert_not_called()

    def test_is_idempotent_when_already_succeeded(self):
        """
        GIVEN a Payment already marked succeeded and booking already confirmed
        WHEN the succeeded handler is called again (duplicate webhook)
        THEN booking stays confirmed and no error is raised.
        """
        booking = HireBookingFactory(status='confirmed')
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_idem',
            status='succeeded',
        )

        handle_payment_intent_succeeded(_intent('pi_hire_idem'))

        booking.refresh_from_db()
        assert booking.status == 'confirmed'

    def test_unknown_intent_id_does_not_raise(self):
        """
        GIVEN an intent_id that has no matching Payment
        WHEN the hire succeeded handler is called
        THEN no exception is raised.
        """
        handle_payment_intent_succeeded(_intent('pi_hire_nonexistent'))


@pytest.mark.django_db
class TestHandlePaymentIntentFailedHire:
    """Tests for the payment_intent.payment_failed handler — hire booking branch."""

    def test_marks_payment_failed(self):
        """
        GIVEN a pending Payment linked to a HireBooking
        WHEN the failed handler is called
        THEN the Payment status becomes failed.
        """
        booking = HireBookingFactory(status='pending_payment')
        payment = HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_fail_1',
            status='pending',
        )

        handle_payment_intent_failed(_intent('pi_hire_fail_1'))

        payment.refresh_from_db()
        assert payment.status == 'failed'

    def test_booking_remains_pending_payment(self):
        """
        GIVEN a pending_payment HireBooking with a pending Payment
        WHEN the failed handler is called
        THEN the booking status stays pending_payment (user can retry).
        """
        booking = HireBookingFactory(status='pending_payment')
        HirePaymentFactory(
            hire_booking=booking,
            stripe_payment_intent_id='pi_hire_fail_2',
            status='pending',
        )

        handle_payment_intent_failed(_intent('pi_hire_fail_2'))

        booking.refresh_from_db()
        assert booking.status == 'pending_payment'
