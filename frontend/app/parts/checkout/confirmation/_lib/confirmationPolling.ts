// Poll our own order status, waiting for the Stripe webhook to confirm it.
export const POLL_INTERVAL_MS = 2000;
export const MAX_ATTEMPTS = 15; // ~30s

export const PAID_STATES = ['paid', 'dispatched', 'completed', 'partially_refunded', 'refunded'];
export const FAILED_STATES = ['cancelled'];

export type ConfirmationMode = 'waiting' | 'confirmed' | 'failed' | 'timeout';
