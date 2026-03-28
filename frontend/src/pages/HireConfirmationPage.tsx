import { useLocation, useNavigate } from 'react-router-dom';
import Seo from '@/components/Seo';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

interface ConfirmationState {
    booking_reference: string;
    motorcycle_name: string;
    hire_start: string;
    hire_end: string;
    num_days: number;
    effective_daily_rate: string;
    total_hire_amount: string;
    bond_amount: string;
}

const formatDate = (dateStr: string) =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

const HireConfirmationPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as ConfirmationState | null;

    if (!state?.booking_reference) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-[var(--text-dark-secondary)]">No booking found.</p>
                <Button className="mt-4" onClick={() => navigate('/hire')}>Browse Hire Bikes</Button>
            </div>
        );
    }

    const bondAmount = parseFloat(state.bond_amount);

    return (
        <>
            <Seo
                title="Booking Confirmed | Allbikes Hire"
                description="Your motorcycle hire booking has been confirmed."
                canonicalPath="/hire/confirmation"
            />
            <div className="bg-[var(--card)]">
                <div className="container mx-auto px-4 lg:px-8 py-16 max-w-lg">
                    <div className="text-center mb-8">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h1 className="text-3xl font-bold text-[var(--text-dark-primary)]">Booking Confirmed!</h1>
                        <p className="text-[var(--text-dark-secondary)] mt-2">
                            We'll be in touch to confirm pickup details.
                        </p>
                    </div>

                    <div className="border border-[var(--border-light)] rounded-lg p-6 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-[var(--text-dark-secondary)]">Booking reference</span>
                            <span className="font-bold text-[var(--text-dark-primary)]">{state.booking_reference}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-dark-secondary)]">Motorcycle</span>
                            <span className="text-[var(--text-dark-primary)]">{state.motorcycle_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-dark-secondary)]">Pick-up date</span>
                            <span className="text-[var(--text-dark-primary)]">{formatDate(state.hire_start)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-dark-secondary)]">Return date</span>
                            <span className="text-[var(--text-dark-primary)]">{formatDate(state.hire_end)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-[var(--text-dark-secondary)]">Duration</span>
                            <span className="text-[var(--text-dark-primary)]">
                                {state.num_days} {state.num_days === 1 ? 'day' : 'days'}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-[var(--border-light)] pt-3">
                            <span className="text-[var(--text-dark-secondary)]">Hire</span>
                            <span className="text-[var(--text-dark-primary)]">
                                ${parseFloat(state.total_hire_amount).toFixed(2)}
                            </span>
                        </div>
                        {bondAmount > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[var(--text-dark-secondary)]">Bond (refundable)</span>
                                <span className="text-[var(--text-dark-primary)]">${bondAmount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-base border-t border-[var(--border-light)] pt-3">
                            <span className="text-[var(--text-dark-primary)]">Total charged</span>
                            <span className="text-[var(--text-dark-primary)]">
                                ${(parseFloat(state.total_hire_amount) + bondAmount).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <Button className="w-full mt-6" onClick={() => navigate('/hire')}>
                        Browse More Bikes
                    </Button>
                </div>
            </div>
        </>
    );
};

export default HireConfirmationPage;
