// src/api.ts
import { authedFetch } from './apiClient';
import { CUSTOMER_ACCESS_TOKEN_HEADER } from './customerAccess';
import type { UserProfile } from '@/types/UserProfile';
import type { Bike } from '@/types/Bike';
import type { PaginatedResponse } from '@/types/PaginatedResponse';
import type { MotorcycleFormData } from '@/types/MotorcycleFormData';
import type { ManagedImage } from '@/types/ManagedImage';
import type { GetBikesOptions } from '@/types/GetBikesOptions';
import type { Product } from '@/types/Product';
import type { AdminNotifications } from '@/types/AdminNotifications';
import type { SentMessage } from '@/types/SentMessage';
import type { BookingRequestLog } from '@/types/BookingRequestLog';
import type { Booking, BookingInput, BlockedDate } from '@/types/Booking';
import type { ServiceSettings } from '@/types/ServiceSettings';
import type { HireBooking, HireSettings } from '@/types/HireBooking';
import type { StockAlertAdminData } from '@/types/StockAlert';
import type { BikeInterestEnquiry, BikeInterestReplyDraft } from '@/types/BikeInterest';

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

  const contentType = response.headers.get('content-type') || '';
  const bodyText = await response.text();
  const isJson = contentType.includes('application/json');
  let data: ApiErrorPayload | null = null;

  if (bodyText && isJson) {
    try {
      data = JSON.parse(bodyText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const fallbackMessage = bodyText
      ? bodyText.replace(/\s+/g, ' ').trim().slice(0, 300)
      : response.statusText || 'An unknown API error occurred.';
    const error = new Error(
      data?.detail || data?.message || `API request failed (${response.status}): ${fallbackMessage}`
    );
    const apiError = error as Error & { data?: ApiErrorPayload | null; status?: number };
    apiError.data = data;
    apiError.status = response.status;
    throw error;
  }

  if (!isJson) {
    throw new Error(`Expected JSON response but received ${contentType || 'unknown content type'}.`);
  }

  return data as T;
}

interface ApiErrorPayload {
  detail?: string;
  message?: string;
  [key: string]: unknown;
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

// Silent check used on initial page load — returns null on any failure without
// triggering the refresh/auth-failure cascade.
export async function checkSession(): Promise<UserProfile | null> {
    const response = await fetch(`${API_BASE_URL}/me/`, { credentials: 'include' });
    if (!response.ok) return null;
    return response.json();
}

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
        vehicle_type,
        page = 1,
        page_size,
        is_hire,
        search,
        make,
        status,
        include_hidden,
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
    if (vehicle_type) params.append('vehicle_type', vehicle_type);
    if (status) params.append('status', status);
    if (include_hidden) params.append('include_hidden', 'true');
    if (page_size) params.append('page_size', String(page_size));
    if (is_hire) params.append('is_hire', 'true');
    if (search) params.append('search', search);
    if (make) params.append('make', make);
    if (ordering) params.append('ordering', ordering);
    if (min_price !== undefined) params.append('min_price', String(min_price));
    if (max_price !== undefined) params.append('max_price', String(max_price));
    if (min_year !== undefined) params.append('min_year', String(min_year));
    if (max_year !== undefined) params.append('max_year', String(max_year));
    if (min_engine_size !== undefined) params.append('min_engine_size', String(min_engine_size));
    if (max_engine_size !== undefined) params.append('max_engine_size', String(max_engine_size));

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

export async function setMotorcycleStockAlertInclusion(id: number, includeInStockAlerts: boolean): Promise<Bike> {
    const response = await authedFetch(`/api/inventory/bikes/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ include_in_stock_alerts: includeInStockAlerts }),
    });
    return handleResponse(response);
}

export async function deleteMotorcycle(id: number): Promise<void> {
    const response = await authedFetch(`/api/inventory/bikes/${id}/`, {
        method: 'DELETE',
    });
    return handleResponse(response);
}

export async function uploadMotorcycleImage(motorcycleId: number, imageFile: File, order: number): Promise<unknown> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('order', String(order));

    const response = await authedFetch(`/api/inventory/bikes/${motorcycleId}/images/`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function manageMotorcycleImages(motorcycleId: number, images: Pick<ManagedImage, 'source_id' | 'order'>[]): Promise<unknown> {
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

export async function subscribeToStockAlerts(email: string): Promise<void> {
    const response = await fetch('/api/inventory/stock-alerts/subscribe/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    await handleResponse(response);
}

export async function adminGetStockAlerts(): Promise<StockAlertAdminData> {
    return handleResponse(await authedFetch('/api/inventory/admin/stock-alerts/'));
}

export async function adminSendStockAlert(): Promise<{ sent_count: number; failed_count: number }> {
    return handleResponse(await authedFetch('/api/inventory/admin/stock-alerts/send/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
    }));
}

// --- Bike Interest Endpoints ---

export async function registerBikeInterest(motorcycle: number, email: string): Promise<void> {
    const response = await fetch('/api/inventory/bike-interest/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motorcycle, email }),
    });
    await handleResponse(response);
}

export async function adminGetBikeInterest(): Promise<{ enquiries: BikeInterestEnquiry[] }> {
    return handleResponse(await authedFetch('/api/inventory/admin/bike-interest/'));
}

export async function adminGetBikeInterestReplyDraft(id: number): Promise<BikeInterestReplyDraft> {
    return handleResponse(await authedFetch(`/api/inventory/admin/bike-interest/${id}/reply/`));
}

export async function adminSendBikeInterestReply(
    id: number,
    payload: { subject: string; body: string },
): Promise<{ detail: string; enquiry: BikeInterestEnquiry }> {
    return handleResponse(await authedFetch(`/api/inventory/admin/bike-interest/${id}/reply/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }));
}

// --- Product Endpoints ---

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

export async function uploadProductImage(productId: number, imageFile: File, order: number): Promise<unknown> {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('order', String(order));
    const response = await authedFetch(`/api/product/products/${productId}/images/`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}

export async function manageProductImages(productId: number, images: Pick<ManagedImage, 'source_id' | 'order'>[]): Promise<unknown> {
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

interface CustomerData {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    terms_accepted: boolean;
}

interface CreateProductOrderData extends CustomerData {
    product: number;
    address_line1: string;
    address_line2: string;
    suburb: string;
    state: string;
    postcode: string;
}

interface CreateBikeOrderData extends CustomerData {
    motorcycle: number;
    selected_colour: string;
}

export async function createProductOrder(data: CreateProductOrderData): Promise<import('@/types/Order').CreatedOrder> {
    const response = await fetch('/api/product/orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function createBikeOrder(data: CreateBikeOrderData): Promise<import('@/types/Order').CreatedOrder> {
    const response = await fetch('/api/inventory/bike-orders/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function getProductOrder(reference: string, token: string): Promise<import('@/types/Order').ProductOrder> {
    const response = await fetch(`/api/product/orders/${reference}/`, {
        headers: { [CUSTOMER_ACCESS_TOKEN_HEADER]: token },
    });
    return handleResponse(response);
}

export async function getBikeOrder(reference: string, token: string): Promise<import('@/types/Order').BikeOrder> {
    const response = await fetch(`/api/inventory/bike-orders/${reference}/`, {
        headers: { [CUSTOMER_ACCESS_TOKEN_HEADER]: token },
    });
    return handleResponse(response);
}

export async function createProductPaymentIntent(reference: string, token: string): Promise<{ clientSecret: string }> {
    const response = await fetch(`/api/product/orders/${reference}/payment-intent/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
    });
    return handleResponse(response);
}

export async function createBikePaymentIntent(reference: string, token: string): Promise<{ clientSecret: string }> {
    const response = await fetch(`/api/inventory/bike-orders/${reference}/payment-intent/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
    });
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

export async function adminGetNotifications(): Promise<AdminNotifications> {
    const response = await authedFetch('/api/payments/admin/notifications/');
    return handleResponse(response);
}

export async function adminGetProductOrders(status?: string, page = 1): Promise<PaginatedResponse<import('@/types/Order').ProductOrder>> {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    const response = await authedFetch(`/api/product/admin/orders/?${params.toString()}`);
    return handleResponse(response);
}

export async function adminGetProductOrder(id: number): Promise<import('@/types/Order').ProductOrder> {
    const response = await authedFetch(`/api/product/admin/orders/${id}/`);
    return handleResponse(response);
}

export async function adminUpdateProductOrderStatus(id: number, status: string): Promise<import('@/types/Order').ProductOrder> {
    const response = await authedFetch(`/api/product/admin/orders/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
}

export async function adminGetBikeOrders(status?: string, page = 1): Promise<PaginatedResponse<import('@/types/Order').BikeOrder>> {
    const params = new URLSearchParams({ page: String(page) });
    if (status) params.append('status', status);
    return handleResponse(await authedFetch(`/api/inventory/admin/bike-orders/?${params.toString()}`));
}

export async function adminGetBikeOrder(id: number): Promise<import('@/types/Order').BikeOrder> {
    return handleResponse(await authedFetch(`/api/inventory/admin/bike-orders/${id}/`));
}

export async function adminUpdateBikeOrderStatus(id: number, status: string): Promise<import('@/types/Order').BikeOrder> {
    const response = await authedFetch(`/api/inventory/admin/bike-orders/${id}/`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
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

// --- Service Diary: Bookings ---

export async function adminGetBookings(options: { start?: string; end?: string; search?: string } = {}): Promise<Booking[]> {
    const params = new URLSearchParams();
    if (options.start) params.append('start', options.start);
    if (options.end) params.append('end', options.end);
    if (options.search) params.append('search', options.search);
    const qs = params.toString();
    const response = await authedFetch(`/api/service/admin/bookings/${qs ? `?${qs}` : ''}`);
    return handleResponse(response);
}

export async function adminGetBooking(id: number): Promise<Booking> {
    const response = await authedFetch(`/api/service/admin/bookings/${id}/`);
    return handleResponse(response);
}

export async function adminCreateBooking(data: BookingInput): Promise<Booking> {
    const response = await authedFetch(`/api/service/admin/bookings/`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminUpdateBooking(id: number, data: Partial<BookingInput>): Promise<Booking> {
    const response = await authedFetch(`/api/service/admin/bookings/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminDeleteBooking(id: number): Promise<void> {
    const response = await authedFetch(`/api/service/admin/bookings/${id}/`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete booking.');
}

// --- Service Diary: Blocked Dates ---

// Upsert a one-off day override. `available: false` force-closes the day;
// `available: true` force-opens it, overriding the advance-notice/weekday rules
// so an admin can make an exception. Posting the same date flips the row.
async function adminSetDateOverride(date: string, available: boolean, reason = ''): Promise<BlockedDate> {
    const response = await authedFetch(`/api/service/admin/blocked-dates/`, {
        method: 'POST',
        body: JSON.stringify({ date, available, reason }),
    });
    return handleResponse(response);
}

export async function adminBlockDate(date: string, reason = ''): Promise<BlockedDate> {
    return adminSetDateOverride(date, false, reason);
}

export async function adminMakeDateAvailable(date: string, reason = ''): Promise<BlockedDate> {
    return adminSetDateOverride(date, true, reason);
}

// Unavailable days for the diary over an explicit range, respecting the
// MechanicDesk-blocked-dates toggle server-side. Returns YYYY-MM-DD strings.
export async function adminGetDiaryUnavailableDays(start: string, end: string): Promise<string[]> {
    const params = new URLSearchParams({ start, end });
    const response = await authedFetch(`/api/service/admin/unavailable-days/?${params.toString()}`);
    const data = await handleResponse<{ unavailable_days: string[] }>(response);
    return data.unavailable_days ?? [];
}

export async function adminGetServiceSettings(): Promise<ServiceSettings> {
    const response = await authedFetch(`/api/service/service-settings/`);
    return handleResponse(response);
}

// --- Hire ---

export async function getPublicHireSettings(): Promise<Pick<HireSettings, 'bond_amount' | 'advance_min_days' | 'advance_max_days' | 'minimum_age' | 'weekly_discount_percent' | 'monthly_discount_percent'>> {
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

export async function getHireExtras(): Promise<import('@/types/HireBooking').HireExtra[]> {
    const response = await fetch('/api/hire/extras/');
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
    extras: { extra_id: number; quantity: number }[];
}): Promise<{
    booking_reference: string;
    access_token: string;
    motorcycle_name: string;
    hire_start: string;
    hire_end: string;
    num_days: number;
    effective_daily_rate: string;
    total_hire_amount: string;
    bond_amount: string;
    extras_total: string;
    total_charged: string;
}> {
    const response = await fetch('/api/hire/bookings/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function createHirePaymentIntent(reference: string, token: string): Promise<{ clientSecret: string }> {
    const response = await fetch(`/api/hire/bookings/${reference}/payment-intent/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
    });
    return handleResponse(response);
}

export async function getHireBookingByReference(reference: string, token: string): Promise<HireBooking> {
    const response = await fetch(`/api/hire/bookings/${reference}/`, {
        headers: { [CUSTOMER_ACCESS_TOKEN_HEADER]: token },
    });
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

export async function adminDownloadHireContract(id: number): Promise<Blob> {
    const response = await authedFetch(`/api/hire/admin/bookings/${id}/contract/`);
    if (!response.ok) throw new Error('Failed to generate contract.');
    return response.blob();
}

export async function adminUpdateHireBookingStatus(id: number, status: string): Promise<HireBooking> {
    const response = await authedFetch(`/api/hire/admin/bookings/${id}/status/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    return handleResponse(response);
}

export async function adminGetHireExtras(): Promise<import('@/types/HireBooking').HireExtra[]> {
    const response = await authedFetch('/api/hire/admin/extras/');
    return handleResponse(response);
}

export async function adminCreateHireExtra(data: { name: string; price_per_day: string; is_active: boolean }): Promise<import('@/types/HireBooking').HireExtra> {
    const response = await authedFetch('/api/hire/admin/extras/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminUpdateHireExtra(id: number, data: Partial<{ name: string; price_per_day: string; is_active: boolean }>): Promise<import('@/types/HireBooking').HireExtra> {
    const response = await authedFetch(`/api/hire/admin/extras/${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminDeleteHireExtra(id: number): Promise<void> {
    const response = await authedFetch(`/api/hire/admin/extras/${id}/`, { method: 'DELETE' });
    return handleResponse(response);
}

export async function getHireBlockedDates(): Promise<import('@/types/HireBlockedDate').HireBlockedDate[]> {
    const response = await fetch('/api/hire/blocked-dates/');
    return handleResponse(response);
}

export async function adminGetHireBlockedDates(): Promise<import('@/types/HireBlockedDate').HireBlockedDate[]> {
    const response = await authedFetch('/api/hire/admin/blocked-dates/');
    return handleResponse(response);
}

export async function adminCreateHireBlockedDate(data: { date_from: string; date_to: string; reason?: string; motorcycle?: number | null }): Promise<import('@/types/HireBlockedDate').HireBlockedDate> {
    const response = await authedFetch('/api/hire/admin/blocked-dates/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return handleResponse(response);
}

export async function adminDeleteHireBlockedDate(id: number): Promise<void> {
    const response = await authedFetch(`/api/hire/admin/blocked-dates/${id}/`, { method: 'DELETE' });
    return handleResponse(response);
}
