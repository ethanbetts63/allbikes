import { authedFetch } from '../apiClient';
import type { ServiceSettings } from '@/types/ServiceSettings';
import type { EnrichedJobType } from '@/types/EnrichedJobType';
import type { BookingFormData } from '@/types/BookingFormData';
export type { BookingFormData } from '@/types/BookingFormData';


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
