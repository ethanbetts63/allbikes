export interface PartsApiError extends Error {
  unavailable?: string[];
}

export async function partsApiError(response: Response, fallback: string): Promise<PartsApiError> {
  const payload = await response.json().catch(() => ({}));
  const error = new Error(
    payload.detail || payload.to?.[0] || fallback,
  ) as PartsApiError;
  error.unavailable = payload.unavailable;
  return error;
}

export async function partsJson<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) throw await partsApiError(response, fallback);
  return response.json() as Promise<T>;
}

export async function partsOk(response: Response, fallback: string): Promise<void> {
  if (!response.ok) throw await partsApiError(response, fallback);
}
