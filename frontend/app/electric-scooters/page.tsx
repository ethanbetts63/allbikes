import { permanentRedirect } from 'next/navigation';
import type { ListSearchParams } from '@/lib/listQuery';

interface PageProps {
  searchParams?: Promise<ListSearchParams>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params ?? {})) {
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    } else if (value) {
      query.set(key, value);
    }
  }

  const queryString = query.toString();
  permanentRedirect(queryString ? `/escooters?${queryString}` : '/escooters');
}
