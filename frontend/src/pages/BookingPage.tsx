import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '@/services/bookingService';
import Seo from '@/components/Seo';
import BookingDetailsForm from '@/forms/BookingDetailsForm';
import BikeDetailsForm from '@/forms/BikeDetailsForm';
import PersonalDetailsForm from '@/forms/PersonalDetailsForm';

const LOCAL_STORAGE_KEY = 'bookingFormProgress';

const initialFormData = {
    // Personal
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    // Bike
    registration_number: '',
    make: '',
    model: '',
    // Booking
    job_type_names: [],
    drop_off_time: '',
    courtesy_vehicle_requested: false,
    note: '',
    terms_accepted: false
};

const STEPS = ['Booking Details', 'Bike Details', 'Your Details'];

const BookingPage = () => {
    const [step, setStep] = useState(1);
    const navigate = useNavigate();
    const [formData, setFormData] = useState(() => {
        try {
            const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
            return savedData ? JSON.parse(savedData) : initialFormData;
        } catch (error) {
            console.error("Error reading from localStorage", error);
            return initialFormData;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [formData]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            await createBooking(formData);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            navigate('/booking/confirmation', {
                state: {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    phone: formData.phone,
                    make: formData.make,
                    model: formData.model,
                    year: formData.year,
                    registration_number: formData.registration_number,
                    drop_off_time: formData.drop_off_time,
                    job_type_names: formData.job_type_names,
                    note: formData.note,
                },
            });
        } catch (error) {
            console.error("Booking submission error:", error);
            setError("There was an error submitting your booking. Please try again.");
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <BookingDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} />;
            case 2:
                return <BikeDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <PersonalDetailsForm formData={formData} setFormData={setFormData} prevStep={prevStep} handleSubmit={handleSubmit} isSubmitting={isSubmitting} error={error} />;
            default:
                return null;
        }
    };

    return (
        <>
            <Seo
                title="Book a Motorcycle or Scooter Service | ScooterShop Perth"
                description="Schedule your motorcycle or scooter service online with Allbikes. Our expert technicians are ready to help you with maintenance, repairs, and more."
                canonicalPath="/booking"
            />
            <div className="bg-[var(--bg-light-primary)] text-[var(--text-dark-primary)] min-h-screen">
                <div className="container mx-auto px-4 py-8 max-w-2xl">

                    <h1 className="text-2xl font-black text-[var(--text-dark-primary)] uppercase tracking-wide mb-2">
                        Request a Service
                    </h1>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2 mb-8">
                        {STEPS.map((label, i) => {
                            const n = i + 1;
                            const active = n === step;
                            const done = n < step;
                            return (
                                <div key={n} className="flex items-center gap-2">
                                    <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest ${active ? 'text-[var(--text-dark-primary)]' : done ? 'text-highlight' : 'text-[var(--text-dark-secondary)]'}`}>
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${active ? 'bg-[var(--text-dark-primary)] text-[var(--bg-light-primary)]' : done ? 'bg-highlight text-[var(--text-dark-primary)]' : 'bg-[var(--border-light)] text-[var(--text-dark-secondary)]'}`}>
                                            {n}
                                        </span>
                                        <span className="hidden sm:inline">{label}</span>
                                    </div>
                                    {i < STEPS.length - 1 && (
                                        <span className="text-[var(--border-light)] text-xs">—</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {renderStep()}

                </div>
            </div>
        </>
    );
};

export default BookingPage;
