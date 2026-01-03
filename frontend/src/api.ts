// src/api.ts
import { authedFetch } from './apiClient';
import type { AuthResponse, UserProfile, Bike } from "@/types";
import type { MotorcycleFormData } from "@/components/admin/inventory/MotorcycleForm";

/**
 * A centralized module for all API interactions.
 */

// --- Type for Paginated API responses ---
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}


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
    const error = new Error(data.detail || 'An unknown API error occurred.');
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
    const response = await authedFetch('/api/data/me/', {
        method: 'GET',
    });
    return handleResponse(response);
}

// --- Inventory Endpoints ---

export async function getBikes(condition?: 'new' | 'used', page: number = 1): Promise<PaginatedResponse<Bike>> {
    let url = `/api/inventory/bikes/?page=${page}`;
    if (condition) {
        url += `&condition=${condition}`;
    }
    const response = await fetch(url, {
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

export async function createMotorcycle(data: Omit<MotorcycleFormData, 'images'>): Promise<Bike> {
    const response = await authedFetch('/api/inventory/bikes/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateMotorcycle(id: number, data: Omit<MotorcycleFormData, 'images'>): Promise<Bike> {
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

export async function uploadMotorcycleImage(motorcycleId: number, imageFile: File): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);

    // Note: When using FormData, we should not set the 'Content-Type' header.
    // The browser will automatically set it to 'multipart/form-data' with the correct boundary.
    const response = await authedFetch(`/api/inventory/bikes/${motorcycleId}/images/`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}