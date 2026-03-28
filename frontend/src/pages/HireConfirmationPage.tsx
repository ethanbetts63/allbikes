import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle } from 'lucide-react';
import { getHireBookingByReference } from '@/api';
import { formatDate } from '@/lib/hire';

interface BookingDetails {
    booking_reference: string;
    motorcycle_name: string;
    hire_start: string;
    hire_end: string;
    num_days: number;
    effective_daily_rate: string;
    total_hire_amount: string;
    bond_amount: string;
}

const HireConfirmationPage = () => {
    const { bookingReference } = useParams<{ bookingReference: string }>();
    const location = useLocation();
    const navigate = useNavigate();

    const stateBooking = location.state as BookingDetails | null;
    const [booking, setBooking] = useState<BookingDetails | null>(stateBooking);
    const [isLoading, setIsLoading] = useState(!stateBooking);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        if (stateBooking || !bookingReference) return;
        getHireBookingByReference(bookingReference)
            .then(setBooking)
            .catch(() => setError('Booking not found.'))
            .finally(() => setIsLoading(false));
    }, [bookingReference]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="bg-[var(--bg-light-primary)] min-h-screen flex justify-center items-center">
                <div className="text-center">
                    <p className="text-[var(--text-dark-secondary)] mb-4">{error || 'No booking found.'}</p>
                    <button onClick={() => navigate('/hire')} className="text-sm underline text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]">
                        Browse Hire Bikes
                    </button>
                </div>
            </div>
        );
    }

    const bondAmount = parseFloat(booking.bond_amount);
    const totalCharged = parseFloat(booking.total_hire_amount) + bondAmount;

    return (
        <>
            <Seo
                title="Booking Confirmed | ScooterShop"
                description="Your motorcycle hire booking has been confirmed."
                noindex={true}
            />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-12 max-w-2xl">

                    {/* Header */}
                    <div className="text-center mb-10">
                        <CheckCircle className="h-16 w-16 text-highlight1 mx-auto mb-4" />
                        <h1 className="text-3xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
                            Booking Confirmed
                        </h1>
                        <p className="text-[var(--text-dark-secondary)] text-sm">
                            A confirmation email will be sent to you shortly.
                        </p>
                    </div>

                    {/* Reference */}
                    <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-5 mb-6 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-1">
                            Booking Reference
                        </p>
                        <p className="text-2xl font-black text-[var(--text-dark-primary)] font-mono tracking-wider">
                            {booking.booking_reference}
                        </p>
                        <p className="text-xs text-[var(--text-dark-secondary)] mt-1">Keep this for your records</p>
                    </div>

                    {/* Details */}
                    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg divide-y divide-stone-100 mb-8">
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Motorcycle</p>
                            <p className="font-bold text-[var(--text-dark-primary)]">{booking.motorcycle_name}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Hire Period</p>
                            <p className="text-[var(--text-dark-primary)] text-sm">{formatDate(booking.hire_start)} — {formatDate(booking.hire_end)}</p>
                            <p className="text-[var(--text-dark-secondary)] text-sm">{booking.num_days} {booking.num_days === 1 ? 'day' : 'days'}</p>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-2">Payment</p>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                    <span>Hire</span>
                                    <span>${parseFloat(booking.total_hire_amount).toFixed(2)}</span>
                                </div>
                                {bondAmount > 0 && (
                                    <div className="flex justify-between text-[var(--text-dark-secondary)]">
                                        <span>Bond (refundable)</span>
                                        <span>${bondAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-[var(--text-dark-primary)] pt-1 border-t border-[var(--border-light)]">
                                    <span>Total charged</span>
                                    <span>${totalCharged.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Pickup & drop-off instructions */}
                    <div className="bg-[var(--bg-light-primary)] border border-[var(--border-light)] rounded-lg p-5 mb-8">
                        <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-3">Pick-up &amp; Drop-off</p>
                        <div className="space-y-3 text-sm text-[var(--text-dark-secondary)]">
                            <p>
                                <span className="font-semibold text-[var(--text-dark-primary)]">Pick-up — </span>
                                Collect your bike any time we are open on <span className="font-semibold text-[var(--text-dark-primary)]">{formatDate(booking.hire_start)}</span>.
                            </p>
                            <p>
                                <span className="font-semibold text-[var(--text-dark-primary)]">Drop-off — </span>
                                Return the bike by close of business on <span className="font-semibold text-[var(--text-dark-primary)]">{formatDate(booking.hire_end)}</span>. You have the bike for the full day.
                            </p>
                            <div className="pt-2 border-t border-[var(--border-light)]">
                                <p className="font-semibold text-[var(--text-dark-primary)] mb-1">Unit 5 / 6 Cleveland Street, Dianella WA 6059</p>
                                <p>Mon – Fri: 9:00 AM – 5:00 PM</p>
                                <p>Sat: 10:00 AM – 1:00 PM</p>
                                <p>Sun: Closed</p>
                            </div>
                        </div>
                    </div>

                    <Link
                        to="/hire"
                        className="text-sm text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)] underline underline-offset-2"
                    >
                        ← Browse More Bikes
                    </Link>

                </div>
            </div>
        </>
    );
};

export default HireConfirmationPage;
