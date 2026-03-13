// src/api.ts
import { authedFetch } from './apiClient';
import type { AuthResponse } from '@/types/AuthResponse';
import type { UserProfile } from '@/types/UserProfile';
import type { Bike } from '@/types/Bike';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import type { MotorcycleFormData } from '@/types/MotorcycleFormData';
import type { ManagedImage } from '@/types/ManagedImage';
import type { TermsAndConditions } from '@/types/TermsAndConditions';
import type { GetBikesOptions } from '@/types/GetBikesOptions';
import type { Product } from '@/types/Product';
import type { Order } from '@/types/Order';

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
    const error = new Error(data.detail || data.message || 'An unknown API error occurred.');
    (error as any).data = data;
    (error as any).status = response.status;
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

// --- Inventory Endpoints ---

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

// --- Product Endpoints ---

export async function getProducts(options: { is_featured?: boolean } = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (options.is_featured) params.append('is_featured', 'true');
    const query = params.toString();
    const response = await fetch(`/api/product/products/${query ? `?${query}` : ''}`);
    return handleResponse(response);
}

export async function getProductById(id: number): Promise<Product> {
    const response = await fetch(`/api/product/products/${id}/`);
    return handleResponse(response);
}

export async function adminGetProducts(): Promise<PaginatedResponse<Product>> {
    const response = await authedFetch('/api/product/products/');
    return handleResponse(response);
}

export async function createProduct(data: Omit<Product, 'id' | 'slug' | 'images' | 'in_stock' | 'low_stock' | 'created_at' | 'updated_at'>): Promise<Product> {
    const response = await authedFetch('/api/product/products/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function updateProduct(id: number, data: Partial<Omit<Product, 'id' | 'slug' | 'images' | 'in_stock' | 'low_stock' | 'created_at' | 'updated_at'>>): Promise<Product> {
    const response = await authedFetch(`/api/product/products/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function deleteProduct(id: number): Promise<void> {
    const response = await authedFetch(`/api/product/products/${id}/`, { method: 'DELETE' });
    return handleResponse(response);
}

export async function uploadProductImage(productId: number, imageFile: File, order: number): Promise<any> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('order', String(order));
    const response = await authedFetch(`/api/product/products/${productId}/images/`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function manageProductImages(productId: number, images: Pick<ManagedImage, 'source_id' | 'order'>[]): Promise<any> {
    const payload = images
        .filter(img => img.source_id !== null)
        .map(img => ({ id: img.source_id, order: img.order }));
    const response = await authedFetch(`/api/product/products/${productId}/manage_images/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return handleResponse(response);
}

// --- Shop / Order Endpoints ---

interface CreateOrderData {
    product: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address_line1: string;
    address_line2: string;
    suburb: string;
    state: string;
    postcode: string;
}

export async function createOrder(data: CreateOrderData): Promise<{ order_id: number; order_reference: string }> {
    const response = await fetch('/api/payments/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function createPaymentIntent(orderId: number): Promise<{ clientSecret: string }> {
    const response = await fetch('/api/payments/create-payment-intent/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
    });
    return handleResponse(response);
}

export async function getOrderByReference(reference: string): Promise<Order> {
    const response = await fetch(`/api/payments/orders/${reference}/`);
    return handleResponse(response);
}

export async function adminGetOrders(status?: string, page = 1): Promise<PaginatedResponse<Order>> {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    const response = await authedFetch(`/api/payments/admin/orders/?${params.toString()}`);
    return handleResponse(response);
}

export async function adminGetOrder(id: number): Promise<Order> {
    const response = await authedFetch(`/api/payments/admin/orders/${id}/`);
    return handleResponse(response);
}

export async function adminUpdateOrderStatus(id: number, status: string): Promise<{ status: string }> {
    const response = await authedFetch(`/api/payments/admin/orders/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
}
