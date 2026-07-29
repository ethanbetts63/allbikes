const key = (reference: string) => `hire-booking:${reference}:access-token`;

export function storeHireBookingToken(reference: string, token: string): void {
  window.sessionStorage.setItem(key(reference), token);
}

export function getHireBookingToken(reference: string): string | null {
  return window.sessionStorage.getItem(key(reference));
}
