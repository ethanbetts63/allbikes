// src/api.ts
import { authedFetch } from './apiClient';
import type { AuthResponse, UserProfile, Bike } from "@/types";

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
    const response = await authedFetch('/api/data-management/me/', {
        method: 'GET',
    });
    return handleResponse(response);
}

// --- Inventory Endpoints ---

export async function getBikes(condition: 'new' | 'used', page: number = 1): Promise<PaginatedResponse<Bike>> {
    const response = await fetch(`/api/inventory/bikes/?condition=${condition}&page=${page}`, {
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