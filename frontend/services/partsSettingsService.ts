import { authedFetch } from '@/apiClient';
import { partsJson } from '@/lib/partsHttp';
import type { PartsSettings } from '@/types/partsSettings';

export async function adminGetPartsSettings(): Promise<PartsSettings> {
  return partsJson<PartsSettings>(
    await authedFetch('/api/parts/admin/settings/'),
    'Failed to load parts settings.',
  );
}

export async function adminUpdatePartsSettings(
  settings: Omit<PartsSettings, 'updated_at'>,
): Promise<PartsSettings> {
  return partsJson<PartsSettings>(
    await authedFetch('/api/parts/admin/settings/', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }),
    'Failed to save parts settings.',
  );
}
