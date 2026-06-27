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

const humanizeField = (field: string): string => {
    const s = field.replace(/_/g, ' ').trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 * Extracts a human-readable message from a failed booking response.
 * Handles the several shapes the backend can return:
 *   - { detail: "..." }                         (DRF / generic)
 *   - { error: "..." }                          (e.g. terms not accepted)
 *   - { email: ["Enter a valid email..."], ... } (serializer field errors)
 */
const parseBookingError = async (response: Response): Promise<string> => {
    let data: unknown;
    try {
        data = await response.json();
    } catch {
        return 'Booking creation failed. Please try again.';
    }

    if (typeof data === 'string') return data;

    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (typeof obj.detail === 'string') return obj.detail;
        if (typeof obj.error === 'string') return obj.error;

        // DRF serializer field errors: { field: ["msg", ...], ... }
        const messages = Object.entries(obj).map(([field, value]) => {
            const text = Array.isArray(value) ? value.join(' ') : String(value);
            return field === 'non_field_errors' ? text : `${humanizeField(field)}: ${text}`;
        });
        if (messages.length) return messages.join('; ');
    }

    return 'Booking creation failed. Please try again.';
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
        throw new Error(await parseBookingError(response));
    }
    return response.json();
};
