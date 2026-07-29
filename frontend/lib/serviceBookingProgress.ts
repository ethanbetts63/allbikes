import { useState, useEffect } from 'react';
import { format, parse, isValid, startOfDay } from 'date-fns';
import type { BookingFormData } from '@/types/BookingFormData';

export const BOOKING_PROGRESS_STORAGE_KEY = 'bookingFormProgress';

// Serialized shape of drop_off_time in storage and the createBooking payload.
const DROP_OFF_TIME_FORMAT = 'dd/MM/yyyy HH:mm';

export const formatDropOffTime = (date: Date, time: string): string =>
    `${format(date, 'dd/MM/yyyy')} ${time}`;

export const parseDropOffTime = (dropOffTime: string): Date | null => {
    if (!dropOffTime) return null;
    const parsed = parse(dropOffTime, DROP_OFF_TIME_FORMAT, new Date());
    return isValid(parsed) ? parsed : null;
};

const initialBookingFormData: BookingFormData = {
    // Personal
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    street_line: '',
    suburb: '',
    state: '',
    postcode: '',
    // Bike
    registration_number: '',
    make: '',
    model: '',
    // Booking
    job_type_names: [],
    drop_off_time: '',
    courtesy_vehicle_requested: false,
    note: '',
    terms_accepted: false,
};

const loadBookingProgress = (): BookingFormData => {
    if (typeof window === 'undefined') return initialBookingFormData;
    try {
        const savedData = localStorage.getItem(BOOKING_PROGRESS_STORAGE_KEY);
        return savedData ? JSON.parse(savedData) : initialBookingFormData;
    } catch (error) {
        console.error("Error reading from localStorage", error);
        return initialBookingFormData;
    }
};

const saveBookingProgress = (formData: BookingFormData) => {
    try {
        localStorage.setItem(BOOKING_PROGRESS_STORAGE_KEY, JSON.stringify(formData));
    } catch (error) {
        console.error("Error writing to localStorage", error);
    }
};

// Step 1 (on /service) is complete when a drop-off time and at least one job type
// are set. A saved drop-off in the past (stale progress from an earlier visit)
// doesn't count — the visitor is sent back to step 1 to pick again.
export const hasStep1Data = (formData: BookingFormData): boolean => {
    const dropOff = parseDropOffTime(formData.drop_off_time);
    return dropOff !== null
        && dropOff >= startOfDay(new Date())
        && (formData.job_type_names?.length ?? 0) > 0;
};

// Booking form state persisted to localStorage. Saved progress is only read
// after mount — reading localStorage during the initial render makes the
// client HTML diverge from the server HTML and breaks hydration.
// `defaultJobTypeName` preselects a job type when the visitor has none saved.
export function useBookingProgress(defaultJobTypeName?: string) {
    const [formData, setFormData] = useState<BookingFormData>(initialBookingFormData);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        let saved = loadBookingProgress();
        if (defaultJobTypeName && (saved.job_type_names?.length ?? 0) === 0) {
            saved = { ...saved, job_type_names: [defaultJobTypeName] };
        }
        // One-shot hydration from localStorage after mount is intentional:
        // it cannot happen during render without breaking SSR hydration.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFormData(saved);
        setHydrated(true);
        // Hydrate once on mount; defaultJobTypeName is fixed per page.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (hydrated) saveBookingProgress(formData);
    }, [formData, hydrated]);

    return { formData, setFormData, hydrated };
}
