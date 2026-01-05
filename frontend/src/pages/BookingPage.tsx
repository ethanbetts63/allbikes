import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createBooking } from '@/services/bookingService';
import Seo from '@/components/Seo';

// Import the step components
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

const BookingPage: React.FC = () => {
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

    // Persist form data to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));
        } catch (error) {
            console.error("Error writing to localStorage", error);
        }
    }, [formData]);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async () => {
        try {
            await createBooking(formData);
            
            // Clear saved data and navigate to success page
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            navigate('/booking/success');

        } catch (error) {
            console.error("Booking submission error:", error);
            toast.error("Submission Failed", {
                description: "There was an error submitting your booking. Please try again.",
            });
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 1:
                return <BookingDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} />;
            case 2:
                return <BikeDetailsForm formData={formData} setFormData={setFormData} nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <PersonalDetailsForm formData={formData} setFormData={setFormData} prevStep={prevStep} handleSubmit={handleSubmit} />;
            default:
                // This case should ideally not be reached if navigation happens on submit
                return <div>Form complete. Thank you!</div>;
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <Seo
                title="Book a Motorcycle or Scooter Service | Allbikes Vespa Warehouse Perth"
                description="Schedule your motorcycle or scooter service online with Allbikes. Our expert technicians are ready to help you with maintenance, repairs, and more."
                canonicalPath="/booking"
            />
            <h1 className="text-4xl font-bold text-center mb-8 text-[var(--text-primary)] ">Book a Service</h1>
            
            {/* We can add a progress bar here later */}
            
            <div className="p-8 border rounded-lg shadow-lg bg-card">
                {renderStep()}
            </div>
        </div>
    );
};

export default BookingPage;
