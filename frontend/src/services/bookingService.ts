import { apiClient } from '../apiClient';

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


export interface ServiceSettings {
    id: number;
    booking_advance_notice: number;
    drop_off_start_time: string; // e.g., "09:00:00"
    drop_off_end_time: string;   // e.g., "17:00:00"
}

/**
 * Fetches the service settings from the backend.
 */
export const getServiceSettings = async (): Promise<ServiceSettings> => {
    try {
        const response = await apiClient.get('/service/settings/');
        return response.data;
    } catch (error) {
        console.error("Error fetching service settings:", error);
        throw error;
    }
};

/**
 * Fetches the list of available job types from the backend.
 */
export const getJobTypes = async (): Promise<any> => {
    try {
        const response = await apiClient.get('/service/job-types/');
        return response.data;
    } catch (error) {
        console.error("Error fetching job types:", error);
        throw error;
    }
};

/**
 * Fetches the list of unavailable days from the backend.
 * @param in_days - Number of days to look ahead.
 */
export const getUnavailableDays = async (in_days: number = 30): Promise<any> => {
    try {
        const response = await apiClient.get(`/service/unavailable-days/?in_days=${in_days}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching unavailable days:", error);
        throw error;
    }
};

/**
 * Submits the completed booking form data to the backend.
 * @param formData - The booking form data.
 */
export const createBooking = async (formData: BookingFormData): Promise<any> => {
    try {
        const response = await apiClient.post('/service/create-booking/', formData);
        return response.data;
    } catch (error) {
        console.error("Error creating booking:", error);
        throw error;
    }
};
