export const STATUS_BADGE: Record<string, string> = {
  Success: 'border-green-600 text-highlight1',
  Failed:  'border-red-500 text-destructive',
};

export type BookingLogFilter = 'all' | 'failed';

/**
 * The raw body the public booking form posted. Typed as unknown values rather
 * than `any` so every read has to go through payloadText.
 */
export type BookingLogPayload = Record<string, unknown>;

export const payloadText = (value: unknown) => String(value);
