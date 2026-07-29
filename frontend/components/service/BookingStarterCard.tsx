"use client";

import { useRouter } from 'next/navigation';
import BookingDetailsForm from '@/components/service/ServiceBookingDetailsForm';
import { Spinner } from '@/components/ui/spinner';
import { useBookingProgress } from '@/lib/serviceBookingProgress';

interface BookingStarterCardProps {
    defaultJobTypeName?: string;
}

const BookingStarterCard = ({ defaultJobTypeName }: BookingStarterCardProps) => {
    const router = useRouter();
    const { formData, setFormData, hydrated } = useBookingProgress(defaultJobTypeName);

    const nextStep = () => router.push('/service-booking/details');

    return (
        <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] rounded-none lg:rounded-xl p-5 sm:p-7 shadow-xl shadow-black/30">
            <div className="border-b border-[var(--border-light)] pb-4 mb-5">
                <h2 className="text-2xl font-black uppercase tracking-wide">Book Your Service</h2>
                <p className="text-sm text-[var(--text-dark-secondary)] mt-1">
                    Step 1 of 3 — pick a drop-off time and tell us what your bike needs.
                </p>
            </div>
            {hydrated ? (
                <BookingDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} />
            ) : (
                <div className="flex items-center justify-center py-24 text-[var(--text-dark-secondary)]">
                    <Spinner className="h-6 w-6" />
                </div>
            )}
        </div>
    );
};

export default BookingStarterCard;
