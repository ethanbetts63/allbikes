// src/api.ts
import { authedFetch } from './apiClient';
import type { UserProfile } from '@/types/UserProfile';
import type { Bike } from '@/types/Bike';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import type { MotorcycleFormData } from '@/types/MotorcycleFormData';
import type { ManagedImage } from '@/types/ManagedImage';
import type { TermsAndConditions } from '@/types/TermsAndConditions';
import type { GetBikesOptions } from '@/types/GetBikesOptions';
import type { Product } from '@/types/Product';
import type { Order } from '@/types/Order';
import type { AdminDashboard } from '@/types/AdminDashboard';
import type { SentMessage } from '@/types/SentMessage';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import type { HireBooking, HireSettings } from '@/types/HireBooking';

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

export async function loginUser(email: string, password: string): Promise<void> {
  const response = await fetch('/api/token/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, password }),
  });
  return handleResponse(response);
}

export async function logoutUser(): Promise<void> {
  await fetch('/api/token/logout/', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
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
        is_hire,
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
    if (is_hire) params.append('is_hire', 'true');
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

export async function getLatestTermsAndConditions(type?: 'hire' | 'service' | 'purchase'): Promise<TermsAndConditions> {
    const url = type ? `${API_BASE_URL}/terms/latest/?type=${type}` : `${API_BASE_URL}/terms/latest/`;
    const response = await fetch(url);
    return handleResponse(response);
}

// --- Product Endpoints ---

export async function getProducts(options: { is_featured?: boolean; ordering?: string; min_price?: number; max_price?: number; page?: number } = {}): Promise<PaginatedResponse<Product>> {
    const params = new URLSearchParams();
    if (options.is_featured) params.append('is_featured', 'true');
    if (options.ordering) params.append('ordering', options.ordering);
    if (options.min_price) params.append('min_price', String(options.min_price));
    if (options.max_price) params.append('max_price', String(options.max_price));
    if (options.page && options.page > 1) params.append('page', String(options.page));
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
    product?: number;
    motorcycle?: number;
    payment_type?: 'full' | 'deposit';
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    address_line1: string;
    address_line2: string;
    suburb: string;
    state: string;
    postcode: string;
    terms_accepted: boolean;
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

export async function getDepositSettings(): Promise<{ deposit_amount: string }> {
    const response = await fetch('/api/payments/deposit-settings/');
    return handleResponse(response);
}

export async function adminUpdateDepositSettings(depositAmount: string): Promise<{ deposit_amount: string }> {
    const response = await authedFetch('/api/payments/admin/deposit-settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deposit_amount: depositAmount }),
    });
    return handleResponse(response);
}

export async function adminGetDashboard(): Promise<AdminDashboard> {
    const response = await authedFetch('/api/payments/admin/dashboard/');
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

// --- Notifications Endpoints ---

export async function adminGetSentMessages(options: { channel?: string; status?: string; message_type?: string; page?: number } = {}): Promise<PaginatedResponse<SentMessage>> {
    const params = new URLSearchParams({ page: String(options.page ?? 1) });
    if (options.channel) params.append('channel', options.channel);
    if (options.status) params.append('status', options.status);
    if (options.message_type) params.append('message_type', options.message_type);
    const response = await authedFetch(`/api/notifications/messages/?${params.toString()}`);
    return handleResponse(response);
}

export async function adminGetSentMessage(id: number): Promise<SentMessage> {
    const response = await authedFetch(`/api/notifications/messages/${id}/`);
    return handleResponse(response);
}

// --- Service Booking Log Endpoints ---

export async function adminGetBookingLogs(options: { status?: string; page?: number } = {}): Promise<PaginatedResponse<BookingRequestLog>> {
    const params = new URLSearchParams({ page: String(options.page ?? 1) });
    if (options.status) params.append('status', options.status);
    const response = await authedFetch(`/api/service/admin/booking-logs/?${params.toString()}`);
    return handleResponse(response);
}

export async function adminGetBookingLog(id: number): Promise<BookingRequestLog> {
    const response = await authedFetch(`/api/service/admin/booking-logs/${id}/`);
    return handleResponse(response);
}

export async function adminDeleteBookingLog(id: number): Promise<void> {
    const response = await authedFetch(`/api/service/admin/booking-logs/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete booking log.');
}

// --- Hire ---

export async function getPublicHireSettings(): Promise<Pick<HireSettings, 'bond_amount' | 'advance_min_days' | 'advance_max_days' | 'minimum_age'>> {
    const response = await fetch('/api/hire/settings/');
    return handleResponse(response);
}

export async function getHireBikes(startDate?: string, endDate?: string): Promise<Bike[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const qs = params.toString();
    const response = await fetch(`/api/hire/bikes/${qs ? `?${qs}` : ''}`);
    return handleResponse(response);
}

export async function checkHireAvailability(motorcycleId: number, startDate: string, endDate: string): Promise<{ available: boolean }> {
    const params = new URLSearchParams({ motorcycle_id: String(motorcycleId), start_date: startDate, end_date: endDate });
    const response = await fetch(`/api/hire/availability/?${params.toString()}`);
    return handleResponse(response);
}

export async function createHireBooking(data: {
    motorcycle: number;
    hire_start: string;
    hire_end: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    terms_accepted: boolean;
    is_of_age: boolean;
}): Promise<{
    booking_id: number;
    booking_reference: string;
    motorcycle_name: string;
    hire_start: string;
    hire_end: string;
    num_days: number;
    effective_daily_rate: string;
    total_hire_amount: string;
    bond_amount: string;
}> {
    const response = await fetch('/api/hire/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function createHirePaymentIntent(bookingId: number): Promise<{ clientSecret: string }> {
    const response = await fetch('/api/hire/create-payment-intent/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId }),
    });
    return handleResponse(response);
}

export async function getHireBookingByReference(reference: string): Promise<{
    booking_reference: string;
    motorcycle_name: string;
    hire_start: string;
    hire_end: string;
    num_days: number;
    effective_daily_rate: string;
    total_hire_amount: string;
    bond_amount: string;
    status: string;
}> {
    const response = await fetch(`/api/hire/bookings/${reference}/`);
    return handleResponse(response);
}


export async function adminGetHireSettings(): Promise<HireSettings> {
    const response = await authedFetch('/api/hire/admin/settings/');
    return handleResponse(response);
}

export async function adminUpdateHireSettings(data: Partial<HireSettings>): Promise<HireSettings> {
    const response = await authedFetch('/api/hire/admin/settings/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminGetHireBookings(status?: string, page = 1): Promise<PaginatedResponse<HireBooking>> {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    const response = await authedFetch(`/api/hire/admin/bookings/?${params.toString()}`);
    return handleResponse(response);
}

export async function adminGetHireBooking(id: number): Promise<HireBooking> {
    const response = await authedFetch(`/api/hire/admin/bookings/${id}/`);
    return handleResponse(response);
}

export async function adminDeleteHireBooking(id: number): Promise<void> {
    const response = await authedFetch(`/api/hire/admin/bookings/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete booking.');
}

export async function adminUpdateHireBookingStatus(id: number, status: string): Promise<HireBooking> {
    const response = await authedFetch(`/api/hire/admin/bookings/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
}
