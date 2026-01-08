// src/api.ts
import { authedFetch } from './apiClient';
import type { AuthResponse, UserProfile, Bike, Brand, SiteSettings, PaginatedResponse, MotorcycleFormData, ManagedImage, TermsAndConditions } from "@/types";

/**
 * A centralized module for all API interactions.
 */


const API_BASE_URL = '/api/data'; // Define API base URL for data-related endpoints

// --- Helper Functions ---

/**
 * A helper function to handle common API response logic.
 * It handles JSON parsing and throws a structured error on failure.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  // Handle successful but empty responses (e.g., from a DELETE request)
  if (response.status === 204) {
    return Promise.resolve(null as T);
  }

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.detail || data.message || 'An unknown API error occurred.'); // Added data.message for generic errors
    (error as any).data = data; // Attach the full error data for more specific handling
    throw error;
  }
  return data as T;
}


// --- Auth Endpoints ---

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  const response = await fetch('/api/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  return handleResponse(response);
}

// --- User Profile Endpoint ---

export async function getUserProfile(): Promise<UserProfile> {
    const response = await authedFetch(`${API_BASE_URL}/me/`, {
        method: 'GET',
    });
    return handleResponse(response);
}

export async function getBrands(): Promise<Brand[]> {
  const response = await fetch(`${API_BASE_URL}/brands/`);
  return handleResponse(response);
}

// --- Inventory Endpoints ---

export interface GetBikesOptions {
    condition?: 'new' | 'used' | 'demo';
    page?: number;
    is_featured?: boolean;
    ordering?: string;
    min_price?: number;
    max_price?: number;
    min_year?: number;
    max_year?: number;
    min_engine_size?: number;
    max_engine_size?: number;
}

export async function getBikes(options: GetBikesOptions = {}): Promise<PaginatedResponse<Bike>> {
    const {
        condition,
        page = 1,
        is_featured,
        ordering,
        min_price,
        max_price,
        min_year,
        max_year,
        min_engine_size,
        max_engine_size,
    } = options;

    const params = new URLSearchParams({
        page: String(page),
    });

    if (condition) params.append('condition', condition);
    if (is_featured) params.append('is_featured', 'true');
    if (ordering) params.append('ordering', ordering);
    if (min_price) params.append('min_price', String(min_price));
    if (max_price) params.append('max_price', String(max_price));
    if (min_year) params.append('min_year', String(min_year));
    if (max_year) params.append('max_year', String(max_year));
    if (min_engine_size) params.append('min_engine_size', String(min_engine_size));
    if (max_engine_size) params.append('max_engine_size', String(max_engine_size));

    const response = await fetch(`/api/inventory/bikes/?${params.toString()}`, {
        method: 'GET',
    });

    return handleResponse(response);
}

export async function getBikeById(id: string): Promise<Bike> {
    const response = await fetch(`/api/inventory/bikes/${id}/`, {
        method: 'GET',
    });
    return handleResponse(response);
}

export async function createMotorcycle(data: Omit<MotorcycleFormData, 'managedImages'>): Promise<Bike> {
    const response = await authedFetch('/api/inventory/bikes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateMotorcycle(id: number, data: Omit<MotorcycleFormData, 'managedImages'>): Promise<Bike> {
    const response = await authedFetch(`/api/inventory/bikes/${id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function deleteMotorcycle(id: number): Promise<void> {
    const response = await authedFetch(`/api/inventory/bikes/${id}/`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}

export async function uploadMotorcycleImage(motorcycleId: number, imageFile: File, order: number): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('order', String(order));

    const response = await authedFetch(`/api/inventory/bikes/${motorcycleId}/images/`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function manageMotorcycleImages(motorcycleId: number, images: Pick<ManagedImage, 'source_id' | 'order'>[]): Promise<any> {
    // We only need to send the database ID and the new order for existing images
    const payload = images
        .filter(img => img.source_id !== null)
        .map(img => ({ id: img.source_id, order: img.order }));

    const response = await authedFetch(`/api/inventory/bikes/${motorcycleId}/manage_images/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

// --- Legal Endpoints ---

export async function getLatestTermsAndConditions(): Promise<TermsAndConditions> {
    const response = await fetch(`${API_BASE_URL}/terms/latest/`);
    return handleResponse(response);
}
