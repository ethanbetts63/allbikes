import React, { useState, useEffect } from 'react';
import { createBooking } from '@/services/bookingService';
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/sonner"


// Import the step components
import BookingDetailsForm from '@/components/booking/BookingDetailsForm';
import BikeDetailsForm from '@/components/booking/BikeDetailsForm';
import PersonalDetailsForm from '@/components/booking/PersonalDetailsForm';

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
    note: ''
};

const BookingPage: React.FC = () => {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
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
            // Here you might add final validation before submitting
            await createBooking(formData);
            toast({
                title: "Booking Submitted!",
                description: "Thank you! We have received your booking request and will be in touch shortly.",
            });
            // Clear saved data and reset form
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setFormData(initialFormData);
            setStep(1);
        } catch (error) {
            console.error("Booking submission error:", error);
            toast({
                title: "Submission Failed",
                description: "There was an error submitting your booking. Please try again.",
                variant: "destructive",
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
                return <div>Form complete. Thank you!</div>;
        }
    }

    return (
        <div className="container mx-auto py-10 max-w-3xl">
            <h1 className="text-4xl font-bold text-center mb-8">Book a Service</h1>
            
            {/* We can add a progress bar here later */}
            
            <div className="p-8 border rounded-lg shadow-lg bg-card">
                {renderStep()}
            </div>
            <Toaster />
        </div>
    );
};

export default BookingPage;
