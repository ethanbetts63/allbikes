type CustomerAccessKind = 'product' | 'bike' | 'parts' | 'hire';
export const CUSTOMER_ACCESS_TOKEN_HEADER = 'X-Customer-Access-Token';

const storageKey = (kind: CustomerAccessKind, reference: string) =>
  `customer-access:${kind}:${reference}`;

export function storeCustomerAccessToken(
  kind: CustomerAccessKind,
  reference: string,
  token: string,
): void {
  if (typeof window === 'undefined') {
    throw new Error('Customer access tokens can only be stored in the browser.');
  }
  window.sessionStorage.setItem(storageKey(kind, reference), token);
}

export function getCustomerAccessToken(
  kind: CustomerAccessKind,
  reference: string,
): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(storageKey(kind, reference));
}
