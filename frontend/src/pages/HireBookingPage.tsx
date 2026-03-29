"use client"

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getBikeById, createHireBooking, createHirePaymentIntent, getPublicHireSettings } from '@/api';
import type { Bike } from '@/types/Bike';
import { formatDate } from '@/lib/hire';

interface BookingFormData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

const HireBookingPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const bikeId = searchParams.get('bike');
    const startDate = searchParams.get('start') || '';
    const endDate = searchParams.get('end') || '';

    const [bike, setBike] = useState<Bike | null>(null);
    const [bondAmount, setBondAmount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isOfAge, setIsOfAge] = useState(false);
    const [minimumAge, setMinimumAge] = useState(21);

    const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>();

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!bikeId || !startDate || !endDate) {
            navigate('/hire');
            return;
        }

        Promise.all([getBikeById(bikeId), getPublicHireSettings()])
            .then(([bikeData, settings]) => {
                if (!bikeData.is_hire || bikeData.status === 'on_hire') {
                    navigate('/hire');
                    return;
                }
                setBike(bikeData);
                setBondAmount(parseFloat(settings.bond_amount));
                setMinimumAge(settings.minimum_age);
            })
            .catch(() => setError('Failed to load bike details.'))
            .finally(() => setIsLoading(false));
    }, [bikeId, startDate, endDate, navigate]);

    const numDays = startDate && endDate
        ? Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(startDate + 'T00:00:00').getTime()) / 86400000) + 1
        : 0;

    const effectiveDailyRate = bike
        ? (() => {
            const candidates: number[] = [];
            if (bike.daily_rate && parseFloat(bike.daily_rate) > 0) candidates.push(parseFloat(bike.daily_rate));
            if (bike.weekly_rate && parseFloat(bike.weekly_rate) > 0) candidates.push(parseFloat(bike.weekly_rate) / 7);
            if (bike.monthly_rate && parseFloat(bike.monthly_rate) > 0) candidates.push(parseFloat(bike.monthly_rate) / 30);
            return candidates.length > 0 ? Math.min(...candidates) : null;
        })()
        : null;

    const totalHireAmount = effectiveDailyRate !== null ? effectiveDailyRate * numDays : null;

    const onSubmit = async (formData: BookingFormData) => {
        if (!bike) return;
        setSubmitError(null);
        setIsSubmitting(true);
        try {
            const booking = await createHireBooking({
                motorcycle: bike.id,
                hire_start: startDate,
                hire_end: endDate,
                customer_name: formData.customer_name,
                customer_email: formData.customer_email,
                customer_phone: formData.customer_phone,
                terms_accepted: true,
                is_of_age: true,
            });
            const { clientSecret } = await createHirePaymentIntent(booking.booking_id);
            navigate(`/hire/book/${booking.booking_reference}/payment`, {
                state: {
                    clientSecret,
                    bookingReference: booking.booking_reference,
                    bookingSummary: {
                        motorcycleName: booking.motorcycle_name,
                        hireStart: booking.hire_start,
                        hireEnd: booking.hire_end,
                        numDays: booking.num_days,
                        totalHireAmount: booking.total_hire_amount,
                        bondAmount: booking.bond_amount,
                    },
                },
            });
        } catch (err: any) {
            setSubmitError(err.message || 'Failed to create booking. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error || !bike) {
        return (
            <div className="flex justify-center items-center h-screen bg-[var(--bg-light-primary)]">
                <div className="text-center">
                    <p className="text-destructive mb-4">{error || 'Bike not found.'}</p>
                    <button onClick={() => navigate('/hire')} className="text-sm underline text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]">
                        Back to Hire
                    </button>
                </div>
            </div>
        );
    }

    const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
    const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image || null;
    const bikeName = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    return (
        <>
            <Seo
                title={`Book ${bikeName} | ScooterShop`}
                description={`Hire the ${bikeName} from ScooterShop Perth.`}
                noindex={true}
            />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-4xl">

                    <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-6">
                        Complete Your Booking
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Booking Summary */}
                        <div className="bg-[var(--bg-light-secondary)] border border-[var(--border-light)] rounded-lg p-4">
                            {imageUrl && (
                                <img
                                    src={imageUrl}
                                    alt={bikeName}
                                    className="w-full aspect-[4/3] object-contain rounded-md mb-4"
                                />
                            )}
                            <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-0.5">
                                {bike.make}
                            </p>
                            <p className="font-bold text-[var(--text-dark-primary)] text-lg mb-3">{bikeName}</p>
                            <div className="flex items-center gap-2 text-[var(--text-dark-secondary)] mb-4">
                                <CalendarDays className="h-4 w-4 shrink-0" />
                                <span className="text-sm">{formatDate(startDate)} — {formatDate(endDate)}</span>
                            </div>
                            <div className="border-t border-[var(--border-light)] pt-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-dark-secondary)]">Daily rate</span>
                                    <span className="text-[var(--text-dark-primary)]">
                                        {effectiveDailyRate !== null ? `$${effectiveDailyRate.toFixed(2)}` : '—'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[var(--text-dark-secondary)]">Duration</span>
                                    <span className="text-[var(--text-dark-primary)]">
                                        {numDays} {numDays === 1 ? 'day' : 'days'}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-[var(--border-light)] pt-2">
                                    <span>Hire total</span>
                                    <span>{totalHireAmount !== null ? `$${totalHireAmount.toFixed(2)}` : '—'}</span>
                                </div>
                                {bondAmount !== null && bondAmount > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-[var(--text-dark-secondary)]">Bond (refundable)</span>
                                        <span>${bondAmount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-base border-t border-[var(--border-light)] pt-2">
                                    <span>Total charged today</span>
                                    <span>
                                        {totalHireAmount !== null && bondAmount !== null
                                            ? `$${(totalHireAmount + bondAmount).toFixed(2)}`
                                            : '—'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div>
                            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dark-secondary)] mb-4">
                                Your Details
                            </h2>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_name">Full Name *</Label>
                                    <Input
                                        id="customer_name"
                                        placeholder="Jane Smith"
                                        {...register('customer_name', { required: 'Name is required' })}
                                    />
                                    {errors.customer_name && (
                                        <p className="text-destructive text-sm">{errors.customer_name.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_email">Email Address *</Label>
                                    <Input
                                        id="customer_email"
                                        type="email"
                                        placeholder="jane@example.com"
                                        {...register('customer_email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: 'Invalid email address',
                                            },
                                        })}
                                    />
                                    {errors.customer_email && (
                                        <p className="text-destructive text-sm">{errors.customer_email.message}</p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="customer_phone">Phone Number *</Label>
                                    <Input
                                        id="customer_phone"
                                        type="tel"
                                        placeholder="0400 000 000"
                                        {...register('customer_phone', { required: 'Phone number is required' })}
                                    />
                                    {errors.customer_phone && (
                                        <p className="text-destructive text-sm">{errors.customer_phone.message}</p>
                                    )}
                                </div>

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-destructive text-sm">{submitError}</p>
                                    </div>
                                )}

                                <div className="flex items-start gap-3 pt-1">
                                    <Checkbox
                                        id="hire_terms_accepted"
                                        checked={termsAccepted}
                                        onCheckedChange={(checked) => setTermsAccepted(!!checked)}
                                        className="mt-0.5"
                                    />
                                    <Label htmlFor="hire_terms_accepted" className="text-sm leading-snug cursor-pointer">
                                        I have read and agree to the{' '}
                                        <a href="/terms?type=hire" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">
                                            Hire Terms and Conditions
                                        </a>
                                        .
                                    </Label>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="hire_is_of_age"
                                        checked={isOfAge}
                                        onCheckedChange={(checked) => setIsOfAge(!!checked)}
                                        className="mt-0.5"
                                    />
                                    <Label htmlFor="hire_is_of_age" className="text-sm leading-snug cursor-pointer">
                                        I confirm that I am {minimumAge} years of age or older.
                                    </Label>
                                </div>

                                <div className="pt-2 space-y-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !termsAccepted || !isOfAge}
                                        className="w-full py-4 px-6 rounded-lg text-base font-bold uppercase tracking-widest transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-highlight hover:bg-highlight/80 text-[var(--text-dark-primary)]"
                                    >
                                        {isSubmitting ? 'Please wait...' : 'Continue to Payment'}
                                    </button>
                                    <p className="text-sm text-[var(--text-dark-secondary)]">
                                        ✓ Booking confirmation sent to your email
                                    </p>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
};

export default HireBookingPage;
