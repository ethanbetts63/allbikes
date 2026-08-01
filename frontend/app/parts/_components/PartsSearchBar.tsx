'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function PartsSearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get('q') ?? searchParams.get('vin') ?? '');

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;

    // VINs are frequently pasted with spaces or hyphens. Send a full VIN to
    // the dedicated decoder; every other query keeps the normal parts search.
    const vin = query.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (vin.length === 17) {
      router.push(`/parts/search?vin=${encodeURIComponent(vin)}`);
    } else {
      router.push(`/parts/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={submit} role="search">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search part, model or 17-character VIN..."
        aria-label="Search parts or VIN"
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-500 focus:border-black focus:outline-none"
      />
    </form>
  );
}
