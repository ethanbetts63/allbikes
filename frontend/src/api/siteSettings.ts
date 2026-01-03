// src/api/siteSettings.ts

const API_BASE_URL = '/api/data_management';

export interface FooterSettings {
    phone_number: string;
    email_address: string;
    street_address: string;
    address_locality: string;
    address_region: string;
    postal_code: string;
    abn_number: string;
    md_number: string;
    mrb_number: string;
    opening_hours_monday: string;
    opening_hours_tuesday: string;
    opening_hours_wednesday: string;
    opening_hours_thursday: string;
    opening_hours_friday: string;
    opening_hours_saturday: string;
    opening_hours_sunday: string;
}

export async function getFooterSettings(): Promise<FooterSettings> {
    const response = await fetch(`${API_BASE_URL}/footer-settings/`);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
}
