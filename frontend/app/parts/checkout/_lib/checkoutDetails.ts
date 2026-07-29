import type { CustomerDetails } from '@/lib/partsCheckoutApi';

export const STORAGE_KEY = 'parts_checkout_details_v1';

export const EMPTY_DETAILS: CustomerDetails = {
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  address_line1: '',
  address_line2: '',
  suburb: '',
  state: '',
  postcode: '',
  terms_accepted: false,
};

/**
 * Everything except the terms box, which is deliberately never remembered —
 * consent has to be given afresh each time.
 */
export const persistableDetails = (form: CustomerDetails) => ({
  customer_name: form.customer_name,
  customer_email: form.customer_email,
  customer_phone: form.customer_phone,
  address_line1: form.address_line1,
  address_line2: form.address_line2,
  suburb: form.suburb,
  state: form.state,
  postcode: form.postcode,
});

export const readStoredDetails = (): CustomerDetails | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return { ...EMPTY_DETAILS, ...JSON.parse(raw), terms_accepted: false };
  } catch {
    return null;
  }
};
