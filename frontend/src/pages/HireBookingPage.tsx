"use client"

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Seo from '@/components/Seo';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { getBikeById, createHireBooking, createHirePaymentIntent } from '@/api';
import type { Bike } from '@/types/Bike';

interface BookingFormData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
}

interface LocationState {
    bikeId?: number;
    startDate?: string;
    endDate?: string;
}

const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const HireBookingPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const bikeId = state?.bikeId;
    const startDate = state?.startDate || '';
    const endDate = state?.endDate || '';

    const [bike, setBike] = useState<Bike | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<BookingFormData>();

    useEffect(() => {
        window.scrollTo(0, 0);
        if (!bikeId || !startDate || !endDate) {
            navigate('/hire');
            return;
        }

        getBikeById(String(bikeId))
            .then(data => {
                if (!data.is_hire || data.status === 'on_hire') {
                    navigate('/hire');
                    return;
                }
                setBike(data);
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
            <div className="flex justify-center items-center h-64">
                <Spinner className="h-12 w-12" />
            </div>
        );
    }

    if (error || !bike) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-destructive">{error || 'Bike not found.'}</p>
                <Button className="mt-4" onClick={() => navigate('/hire')}>Back to Hire</Button>
            </div>
        );
    }

    const sortedImages = [...bike.images].sort((a, b) => a.order - b.order);
    const imageUrl = sortedImages[0]?.thumbnail || sortedImages[0]?.image || null;
    const bikeName = bike.year ? `${bike.year} ${bike.make} ${bike.model}` : `${bike.make} ${bike.model}`;

    return (
        <>
            <Seo
                title={`Book ${bikeName} | Allbikes Hire`}
                description={`Hire the ${bikeName} from Allbikes.`}
                canonicalPath="/hire/book"
            />
            <div className="bg-[var(--card)]">
                <div className="container mx-auto px-4 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-[var(--text-dark-primary)] mb-8">Complete Your Booking</h1>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                        {/* Booking Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Booking Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt={bikeName}
                                        className="w-full aspect-[4/3] object-contain rounded-md"
                                    />
                                )}
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-dark-secondary)]">
                                        {bike.make}
                                    </p>
                                    <h2 className="text-xl font-bold text-[var(--text-dark-primary)]">{bikeName}</h2>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--text-dark-secondary)]">
                                    <CalendarDays className="h-4 w-4 shrink-0" />
                                    <span className="text-sm">
                                        {formatDate(startDate)} — {formatDate(endDate)}
                                    </span>
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
                                    <div className="flex justify-between font-bold text-base border-t border-[var(--border-light)] pt-2">
                                        <span className="text-[var(--text-dark-primary)]">Hire total</span>
                                        <span className="text-[var(--text-dark-primary)]">
                                            {totalHireAmount !== null ? `$${totalHireAmount.toFixed(2)}` : '—'}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Details Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Your Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_name">Full Name</Label>
                                        <Input
                                            id="customer_name"
                                            {...register('customer_name', { required: 'Name is required' })}
                                        />
                                        {errors.customer_name && (
                                            <p className="text-destructive text-sm">{errors.customer_name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_email">Email Address</Label>
                                        <Input
                                            id="customer_email"
                                            type="email"
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
                                    <div className="space-y-2">
                                        <Label htmlFor="customer_phone">Phone Number</Label>
                                        <Input
                                            id="customer_phone"
                                            type="tel"
                                            {...register('customer_phone', { required: 'Phone number is required' })}
                                        />
                                        {errors.customer_phone && (
                                            <p className="text-destructive text-sm">{errors.customer_phone.message}</p>
                                        )}
                                    </div>

                                    {submitError && (
                                        <p className="text-destructive text-sm">{submitError}</p>
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

                                    <Button type="submit" disabled={isSubmitting || !termsAccepted} className="w-full">
                                        {isSubmitting ? 'Please wait...' : 'Proceed to Payment'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </>
    );
};

export default HireBookingPage;
