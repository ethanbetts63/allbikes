import { authedFetch } from '../apiClient';
import type { ServiceSettings, EnrichedJobType } from '../types';

// Type for the form data, should match the backend serializer
// It's good practice to define this in a types file, but placing here for now.
export interface BookingFormData {
    [key: string]: any; // Allows flexible indexing
    first_name: string;
    last_name: string;
    phone: string;
    email: string;
    street_line?: string;
    suburb?: string;
    state?: string;
    postcode?: string;
    registration_number: string;
    make: string;
    model: string;
    year?: number | null;
    color?: string;
    transmission?: string;
    vin?: string;
    fuel_type?: string;
    drive_type?: string;
    engine_size?: string;
    body?: string;
    odometer?: number | null;
    drop_off_time: string;
    pickup_time?: string;
    job_type_names: string[];
    courtesy_vehicle_requested: boolean;
    note?: string;
}


/**
 * Fetches the service settings from the backend.
 */
export const getServiceSettings = async (): Promise<ServiceSettings> => {
    const response = await authedFetch('/api/service/settings/');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

/**
 * Fetches the list of available job types from the backend, enriched with descriptions.
 */
export const getJobTypes = async (): Promise<EnrichedJobType[]> => {
    const response = await authedFetch('/api/service/job-types/');
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

/**
 * Fetches the list of unavailable days from the backend.
 * @param in_days - Number of days to look ahead.
 */
export const getUnavailableDays = async (in_days: number = 30): Promise<{ unavailable_days: string[] }> => {
    const response = await authedFetch(`/api/service/unavailable-days/?in_days=${in_days}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

/**
 * Submits the completed booking form data to the backend.
 * @param formData - The booking form data.
 */
export const createBooking = async (formData: BookingFormData): Promise<any> => {
    const response = await authedFetch('/api/service/create-booking/', {
        method: 'POST',
        body: JSON.stringify(formData),
    });
    if (!response.ok) {
        // Try to parse the error response from the server
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Booking creation failed');
    }
    return response.json();
};
